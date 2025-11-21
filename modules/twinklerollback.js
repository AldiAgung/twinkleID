// <nowiki>

(function() {

/*
 ****************************************
 *** twinklerollback.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on contributions, recent changes, history, and diff pages
 * Active on:              Diff pages, history pages, Special:RecentChanges(Linked),
                           and Special:Contributions
 */

/**
 * Twinklerollback revert and antivandalism utility
 */

Twinkle.rollback = function twinklerollback() {
	// Only proceed if the user can actually edit the page in question
	// (see #632 for contribs issue).  wgIsProbablyEditable should take
	// care of namespace/contentModel restrictions as well as explicit
	// protections; it won't take care of cascading or TitleBlacklist.
	if (mw.config.get('wgIsProbablyEditable')) {
		// wgDiffOldId included for clarity in if else loop [[phab:T214985]]
		if (mw.config.get('wgAction') === 'view' && mw.config.get('wgRevisionId') && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId')) {
			Twinkle.rollback.addLinks.oldid();
		} else if (mw.config.get('wgAction') === 'history' && mw.config.get('wgArticleId')) {
			Twinkle.rollback.addLinks.history();
		}
	} else if (mw.config.get('wgNamespaceNumber') === -1) {
		Twinkle.rollback.skipTalk = !Twinkle.getPref('openTalkPageOnAutoRevert');
		Twinkle.rollback.rollbackInPlace = Twinkle.getPref('rollbackInPlace');

		switch (mw.config.get('wgCanonicalSpecialPageName')) {
			case 'Contributions':
			case 'IPContributions':
				Twinkle.rollback.addLinks.contributions();
				break;
			case 'Recentchanges':
			case 'Recentchangeslinked':
				// Reload with recent changes updates
				// structuredChangeFilters.ui.initialized is just on load
				mw.hook('wikipage.content').add(($context) => {
					if (!$context || !$context.is('div')) {
						return;
					}
					Twinkle.rollback.addLinks.recentchanges($context);
				});
				break;
		}
	}
	// Reload when revision slider or other scripts dynamically load diff content.
	mw.hook('wikipage.diff').add(($context) => {
		if (!$context) {
			return;
		}
		// Only proceed if the user can actually edit the page in question,
		// wgDiffOldId included for clarity in if else loop [[phab:T214985]]
		if (mw.config.get('wgIsProbablyEditable') && (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId'))) {
			Twinkle.rollback.addLinks.diff($context);
		}
	});
};

// A list of usernames, usually only bots, that vandalism revert is jumped
// over; that is, if vandalism revert was chosen on such username, then its
// target is on the revision before.  This is for handling quick bots that
// makes edits seconds after the original edit is made.  This only affects
// vandalism rollback; for good faith rollback, it will stop, indicating a bot
// has no faith, and for normal rollback, it will rollback that edit.
Twinkle.rollback.trustedBots = ['AnomieBOT', 'SineBot', 'MajavahBot','Ruhivabot', 'HsfBot', 'Wagino Bot'];
Twinkle.rollback.skipTalk = null;
Twinkle.rollback.rollbackInPlace = null;
// String to insert when a username is hidden
Twinkle.rollback.hiddenName = 'pengguna tidak diketahui';

// Consolidated construction of rollback links
Twinkle.rollback.linkBuilder = {
	spanTag: function(color, content) {
		const span = document.createElement('span');
		span.style.color = color;
		span.appendChild(document.createTextNode(content));
		return span;
	},

	buildLink: function(color, text) {
		const link = document.createElement('a');
		link.appendChild(Twinkle.rollback.linkBuilder.spanTag('Black', '['));
		link.appendChild(Twinkle.rollback.linkBuilder.spanTag(color, text));
		link.appendChild(Twinkle.rollback.linkBuilder.spanTag('Black', ']'));
		link.href = '#';
		return link;
	},

	/**
	 * @param {string} [vandal=null] - Username of the editor being reverted
	 * Provide a falsey value if the username is hidden, defaults to null
	 * @param {boolean} inline - True to create two links in a span, false
	 * to create three links in a div (optional)
	 * @param {number|string} [rev=wgCurRevisionId] - Revision ID being reverted (optional)
	 * @param {string} [page=wgPageName] - Page being reverted (optional)
	 */
	rollbackLinks: function(vandal, inline, rev, page) {
		vandal = vandal || null;

		const elem = inline ? 'span' : 'div';
		const revNode = document.createElement(elem);

		rev = parseInt(rev, 10);
		if (rev) {
			revNode.setAttribute('id', 'tw-revert' + rev);
		} else {
			revNode.setAttribute('id', 'tw-revert');
		}

		const separator = inline ? ' ' : ' || ';
		const sepNode1 = document.createElement('span');
		const sepText = document.createTextNode(separator);
		sepNode1.setAttribute('class', 'tw-rollback-link-separator');
		sepNode1.appendChild(sepText);

		const sepNode2 = sepNode1.cloneNode(true);

		const normNode = document.createElement('span');
		const vandNode = document.createElement('span');

		const normLink = Twinkle.rollback.linkBuilder.buildLink('SteelBlue', 'kembalikan');
		const vandLink = Twinkle.rollback.linkBuilder.buildLink('Red', 'vandalisme');

		normLink.style.fontWeight = 'bold';
		vandLink.style.fontWeight = 'bold';

		$(normLink).on('click', (e) => {
			e.preventDefault();
			Twinkle.rollback.revert('norm', vandal, rev, page);
			Twinkle.rollback.disableLinks(revNode);
		});
		$(vandLink).on('click', (e) => {
			e.preventDefault();
			Twinkle.rollback.revert('vand', vandal, rev, page);
			Twinkle.rollback.disableLinks(revNode);
		});

		normNode.setAttribute('class', 'tw-rollback-link-normal');
		vandNode.setAttribute('class', 'tw-rollback-link-vandalism');

		normNode.appendChild(sepNode1);
		vandNode.appendChild(sepNode2);

		normNode.appendChild(normLink);
		vandNode.appendChild(vandLink);

		if (!inline) {
			const agfNode = document.createElement('span');
			const agfLink = Twinkle.rollback.linkBuilder.buildLink('DarkOliveGreen', 'kembalikan (ANB)');
			$(agfLink).on('click', (e) => {
				e.preventDefault();
				Twinkle.rollback.revert('agf', vandal, rev, page);
				// Twinkle.rollback.disableLinks(revNode); // rollbackInPlace not relevant for any inline situations
			});
			agfNode.setAttribute('class', 'tw-rollback-link-agf');
			agfLink.style.fontWeight = 'bold';
			agfNode.appendChild(agfLink);
			revNode.appendChild(agfNode);
		}

		revNode.appendChild(normNode);
		revNode.appendChild(vandNode);

		return revNode;
	},

	// Build [restore this revision] links
	restoreThisRevisionLink: function(revisionRef, inline) {
		// If not a specific revision number, should be wgDiffNewId/wgDiffOldId/wgRevisionId
		revisionRef = typeof revisionRef === 'number' ? revisionRef : mw.config.get(revisionRef);

		const elem = inline ? 'span' : 'div';
		const revertToRevisionNode = document.createElement(elem);

		revertToRevisionNode.setAttribute('id', 'tw-revert-to-' + revisionRef);
		revertToRevisionNode.style.fontWeight = 'bold';

		const revertToRevisionLink = Twinkle.rollback.linkBuilder.buildLink('SaddleBrown', 'Kembalikan versi ini');
		$(revertToRevisionLink).on('click', (e) => {
			e.preventDefault();
			Twinkle.rollback.revertToRevision(revisionRef);
		});

		if (inline) {
			revertToRevisionNode.appendChild(document.createTextNode(' '));
		}
		revertToRevisionNode.appendChild(revertToRevisionLink);
		return revertToRevisionNode;
	}
};

Twinkle.rollback.addLinks = {
	contributions: function() {
		// $('sp-contributions-footer-anon-range') relies on the fmbox
		// id in [[MediaWiki:Sp-contributions-footer-anon-range]] and
		// is used to show rollback/vandalism links for IP ranges
		const isRange = !!$('#sp-contributions-footer-anon-range')[0];
		if (mw.config.exists('wgRelevantUserName') || isRange) {
			// Get the username these contributions are for
			let username = mw.config.get('wgRelevantUserName');
			if (Twinkle.getPref('showRollbackLinks').includes('contribs') ||
				(mw.config.get('wgUserName') !== username && Twinkle.getPref('showRollbackLinks').includes('others')) ||
				(mw.config.get('wgUserName') === username && Twinkle.getPref('showRollbackLinks').includes('mine'))) {
				const $list = $('#mw-content-text').find('ul li:has(span.mw-uctop):has(.mw-changeslist-diff)');

				$list.each((key, current) => {
					// revid is also available in the href of both
					// .mw-changeslist-date or .mw-changeslist-diff
					const page = $(current).find('.mw-contributions-title').text();

					// Get username for IP ranges (wgRelevantUserName is null)
					if (isRange) {
						// The :not is possibly unnecessary, as it appears that
						// .mw-userlink is simply not present if the username is hidden
						username = $(current).find('.mw-userlink:not(.history-deleted)').text();
					}

					// It's unlikely, but we can't easily check for revdel'd usernames
					// since only a strong element is provided, with no easy selector [[phab:T255903]]
					current.appendChild(Twinkle.rollback.linkBuilder.rollbackLinks(username, true, current.dataset.mwRevid, page));
				});
			}
		}
	},

	recentchanges: function($context) {
		if (Twinkle.getPref('showRollbackLinks').includes('recent')) {
			// Latest and revertable (not page creations, logs, categorizations, etc.)
			const selector = '.mw-changeslist-last.mw-changeslist-src-mw-edit';
			let $list = $context.hasClass('mw-changeslist') ? $context.find(selector) : $context.find('.mw-changeslist ' + selector);
			if (!$list.length) {
				return;
			}
			// Exclude top-level header if "group changes" preference is used
			// and find only individual lines or nested lines
			$list = $list.not('.mw-rcfilters-ui-highlights-enhanced-toplevel').find('.mw-changeslist-line-inner, td.mw-enhanced-rc-nested');

			$list.each((key, current) => {
				// The :not is possibly unnecessary, as it appears that
				// .mw-userlink is simply not present if the username is hidden
				const vandal = $(current).find('.mw-userlink:not(.history-deleted)').text();
				const href = $(current).find('.mw-changeslist-diff').attr('href');
				const rev = mw.util.getParamValue('diff', href);
				const page = current.dataset.targetPage;
				current.appendChild(Twinkle.rollback.linkBuilder.rollbackLinks(vandal, true, rev, page));
			});
		}
	},

	history: function() {
		if (Twinkle.getPref('showRollbackLinks').includes('history')) {
			// All revs
			const histList = $('#pagehistory li').toArray();

			// On first page of results, so add revert/rollback
			// links to the top revision
			if (!$('a.mw-firstlink').length) {
				const firstRow = histList.shift();
				const firstUser = $(firstRow).find('.mw-userlink:not(.history-deleted)').text();

				// Check for first username different than the top user,
				// only apply rollback links if/when found
				// for() faster than every()
				for (let i = 0; i < histList.length; i++) {
					const hasMoreThanOneUser = $(histList[i]).find('.mw-userlink').text() !== firstUser;
					if (hasMoreThanOneUser) {
						firstRow.appendChild(Twinkle.rollback.linkBuilder.rollbackLinks(firstUser, true));
						break;
					}
				}
			}

			// oldid
			histList.forEach((rev) => {
				// From restoreThisRevision, non-transferable
				// If the text has been revdel'd, it gets wrapped in a span with .history-deleted,
				// and href will be undefined (and thus oldid is NaN)
				const href = rev.querySelector('.mw-changeslist-date').href;
				const oldid = parseInt(mw.util.getParamValue('oldid', href), 10);
				if (!isNaN(oldid)) {
					rev.appendChild(Twinkle.rollback.linkBuilder.restoreThisRevisionLink(oldid, true));
				}
			});

		}
	},

	diff: function($context) {
		// Autofill user talk links on diffs with vanarticle for easy warning, but don't autowarn
		const warnFromTalk = function(xtitle) {
			const $talkLink = $context.find('#mw-diff-' + xtitle + '2 .mw-usertoollinks a').first();
			if ($talkLink.length) {
				let extraParams = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm) + '&noautowarn=true';
				// diffIDs for vanarticlerevid
				extraParams += '&vanarticlerevid=';
				extraParams += xtitle === 'otitle' ? mw.config.get('wgDiffOldId') : mw.config.get('wgDiffNewId');

				const href = $talkLink.attr('href');
				if (!href.includes('?')) {
					$talkLink.attr('href', href + '?' + extraParams);
				} else {
					$talkLink.attr('href', href + '&' + extraParams);
				}
			}
		};

		// Older revision
		warnFromTalk('otitle'); // Add quick-warn link to user talk link
		// Don't load if there's a single revision or weird diff (cur on latest)
		if (mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId'))) {
			// Add a [restore this revision] link to the older revision
			const oldTitle = $context.find('#mw-diff-otitle1').parent().get(0);
			if (oldTitle) {
				oldTitle.insertBefore(Twinkle.rollback.linkBuilder.restoreThisRevisionLink('wgDiffOldId'), oldTitle.firstChild);
			}
		}

		// Newer revision
		warnFromTalk('ntitle'); // Add quick-warn link to user talk link
		// Add either restore or rollback links to the newer revision
		// Don't show if there's a single revision or weird diff (prev on first)
		if ($context.find('#differences-nextlink').length) {
			// Not latest revision, add [restore this revision] link to newer revision
			const newTitle = $context.find('#mw-diff-ntitle1').parent().get(0);
			if (newTitle) {
				newTitle.insertBefore(Twinkle.rollback.linkBuilder.restoreThisRevisionLink('wgDiffNewId'), newTitle.firstChild);
			}
		} else if (Twinkle.getPref('showRollbackLinks').includes('diff') && mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId') || $context.find('#differences-prevlink').length)) {
			// Normally .mw-userlink is a link, but if the
			// username is hidden, it will be a span with
			// .history-deleted as well. When a sysop views the
			// hidden content, the span contains the username in a
			// link element, which will *just* have
			// .mw-userlink. The below thus finds the first
			// instance of the class, which if hidden is the span
			// and thus text returns undefined. Technically, this
			// is a place where sysops *could* have more
			// information available to them (as above, via
			// &unhide=1), since the username will be available by
			// checking a.mw-userlink instead, but revert() will
			// need reworking around userHidden
			let vandal = $context.find('#mw-diff-ntitle2').find('.mw-userlink')[0];
			// See #1337
			vandal = vandal ? vandal.text : '';
			const ntitle = $context.find('#mw-diff-ntitle1').parent().get(0);
			if (ntitle) {
			ntitle.insertBefore(Twinkle.rollback.linkBuilder.rollbackLinks(vandal), ntitle.firstChild);
			}
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		const revisionInfo = document.getElementById('mw-revision-info');
		if (revisionInfo) {
			const title = revisionInfo.parentNode;
			title.insertBefore(Twinkle.rollback.linkBuilder.restoreThisRevisionLink('wgRevisionId'), title.firstChild);
		}
	}
};

Twinkle.rollback.disableLinks = function disablelinks(parentNode) {
	$(parentNode).children().each((_ix, node) => {
		node.innerHTML = node.textContent; // Feels like cheating
		$(node).css('font-weight', 'normal').css('color', 'darkgray');
	});
};

Twinkle.rollback.revert = function revertPage(type, vandal, rev, page) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = Morebits.ip.sanitizeIPv6(vandal);
	}

	const pagename = page || mw.config.get('wgPageName');
	const revid = rev || mw.config.get('wgCurRevisionId');

	if (Twinkle.rollback.rollbackInPlace) {
		const notifyStatus = document.createElement('span');
		mw.notify(notifyStatus, {
			autoHide: false,
			title: 'Pengembalian pada ' + page,
			tag: 'twinklerollback_' + rev // Shouldn't be necessary given disableLink
		});
		Morebits.Status.init(notifyStatus);
	} else {
		Morebits.Status.init(document.getElementById('mw-content-text'));
	}

	const params = {
		type: type,
		user: vandal,
		userHidden: !vandal, // Keep track of whether the username was hidden
		pagename: pagename,
		revid: revid
	};

	const query = {
		action: 'query',
		prop: ['info', 'revisions', 'flagged'],
		titles: pagename,
		inprop: 'watched',
		intestactions: 'edit',
		rvlimit: Twinkle.getPref('revertMaxRevisions'),
		rvprop: [ 'ids', 'timestamp', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	const wikipedia_api = new Morebits.wiki.Api('Mengambil data dari revisi sebelumnya', query, Twinkle.rollback.callbacks.main);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.rollback.revertToRevision = function revertToRevision(oldrev) {

	Morebits.Status.init(document.getElementById('mw-content-text'));

	const query = {
		action: 'query',
		prop: ['info', 'revisions'],
		titles: mw.config.get('wgPageName'),
		inprop: 'watched',
		rvlimit: 1,
		rvstartid: oldrev,
		rvprop: [ 'ids', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	const wikipedia_api = new Morebits.wiki.Api('Mengambil dari revisi sebelumnya', query, Twinkle.rollback.callbacks.toRevision);
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

Twinkle.rollback.callbacks = {
	toRevision: function(apiobj) {
		const response = apiobj.getResponse();

		const loadtimestamp = response.curtimestamp;
		const csrftoken = response.query.tokens.csrftoken;

		const page = response.query.pages[0];
		const lastrevid = parseInt(page.lastrevid, 10);
		const touched = page.touched;

		const rev = page.revisions[0];
		const revertToRevID = parseInt(rev.revid, 10);
		const revertToUser = rev.user;
		const revertToUserHidden = !!rev.userhidden;

		if (revertToRevID !== apiobj.params.rev) {
			apiobj.statelem.error('Revisi yang diperoleh tidak sama dengan revisi yang diminta. Membatalkan.');
			return;
		}

		const optional_summary = prompt('Sebutkan alasan pengembalian:                                ', ''); // padded out to widen prompt in Firefox
		if (optional_summary === null) {
			apiobj.statelem.error('Dibatalkan oleh pengguna.');
			return;
		}

		const summary = Twinkle.rollback.formatSummary('Revisi dipulihkan ' + revertToRevID + ' oleh $USER',
			revertToUserHidden ? null : revertToUser, optional_summary || '');

		const query = {
			action: 'edit',
			title: mw.config.get('wgPageName'),
			summary: summary,
			tags: Twinkle.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: revertToRevID,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: Twinkle.getPref('markRevertedPagesAsMinor').includes('torev') ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (Twinkle.getPref('watchRevertedPages').includes('torev')) {
			const watchOrExpiry = Twinkle.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in Twinkle.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = 'Pembatalan selesai';

		const wikipedia_api = new Morebits.wiki.Api('Menyimpan konten pembatalan', query, Twinkle.rollback.callbacks.complete, apiobj.statelem);
		wikipedia_api.params = apiobj.params;
		wikipedia_api.post();
	},
	main: function(apiobj) {
		const response = apiobj.getResponse();

		const loadtimestamp = response.curtimestamp;
		const csrftoken = response.query.tokens.csrftoken;

		const page = response.query.pages[0];
		if (!page.actions.edit) {
			apiobj.statelem.error("Tidak dapat menyunting, kemungkinan dilindungi.");
			return;
		}

		const lastrevid = parseInt(page.lastrevid, 10);
		const touched = page.touched;

		const revs = page.revisions;

		const statelem = apiobj.statelem;
		const params = apiobj.params;

		if (revs.length < 1) {
			statelem.error('Tidak memiliki satu pun revisi tambahan, sehingga tidak mungkin untuk dikembalikan.');
			return;
		}
		const top = revs[0];
		const lastuser = top.user;

		if (lastrevid < params.revid) {
			Morebits.Status.error('Error', [ 'Penanda revisi terakhir yang diperoleh dari peladen, ', Morebits.htmlNode('strong', lastrevid), ', kurang dari penanda revisi yang saat ini ditampilkan. Ini menandakan bahwa revisi saat ini sudah dihapus, peladen sedang tersendat, atau data buruk yang diterima. Proses aka dihentikan.' ]);
			return;
		}

		// Used for user-facing alerts, messages, etc., not edits or summaries
		let userNorm = params.user || Twinkle.rollback.hiddenName;
		let index = 1;
		if (params.revid !== lastrevid) {
			Morebits.Status.warn('Peringatan', [ 'Revisi terakhir ', Morebits.htmlNode('strong', lastrevid), ' tidak sesuai dengan revisi kami ', Morebits.htmlNode('strong', params.revid) ]);
			// Treat ipv6 users on same 64 block as the same
			if (lastuser === params.user || (mw.util.isIPv6Address(params.user) && Morebits.ip.get64(lastuser) === Morebits.ip.get64(params.user))) {
				switch (params.type) {
					case 'vand':
						var diffUser = lastuser !== params.user;
						Morebits.Status.info('Info', [ 'Revisi terbaru ' + (diffUser ? '' : 'juga ') + 'dibuat oleh ', Morebits.htmlNode('strong', userNorm),
							diffUser ? ', yang juga sama dalam subnet /64' : '', '. Karena menduga adanya vandalisme, melanjutkan untuk mengembalikan.' ]);
						break;
					case 'agf':
						Morebits.Status.warn('Peringatan', [ 'Revisi terbaru dibuat oleh ', Morebits.htmlNode('strong', userNorm), '. Asumsi suntingan niat baik, membatalkan pembalikkan dikarenakan masalahnya telah selesai.' ]);
						return;
					default:
						Morebits.Status.warn('Pemberitahuan', [ 'Revisi terbaru dibuat oleh ', Morebits.htmlNode('strong', userNorm), ', membatalkan.' ]);
						return;
				}
			} else if (params.type === 'vand' &&
					// Okay to test on user since it will either fail or sysop will correctly access it
					// Besides, none of the trusted bots are going to be revdel'd
					Twinkle.rollback.trustedBots.includes(top.user) && revs.length > 1 &&
					revs[1].revid === params.revid) {
				Morebits.Status.info('Info', [ 'Revisi terbaru dibuat oleh ', Morebits.htmlNode('strong', lastuser), ', bot terpecaya, dan revisinya telah dibuat sebelum vandal, melanjutkan.' ]);
				index = 2;
			} else {
				Morebits.Status.error('Error', [ 'Revisi terbaru dibuat oleh ', Morebits.htmlNode('strong', lastuser), ', mungkin telah dibalikkan, membatalkan.']);
				return;
			}

		} else {
			// Expected revision is the same, so the users must match;
			// this allows sysops to know whether the users are the same
			params.user = lastuser;
			userNorm = params.user || Twinkle.rollback.hiddenName;
		}

		if (Twinkle.rollback.trustedBots.includes(params.user)) {
			switch (params.type) {
				case 'vand':
					Morebits.Status.info('Info', [ 'Suntingan vandal telah dipilih pada ', Morebits.htmlNode('strong', userNorm), '. Karena ini adalah bot tepercaya, berasumsi Anda ingin mengembalikan vandalisme yang dilakukan oleh pengguna sebelumnya.' ]);
					index = 2;
					params.user = revs[1].user;
					params.userHidden = !!revs[1].userhidden;
					break;
				case 'agf':
					Morebits.Status.warn('Pemberitahuan', [ 'Pembatalan suntingan niat baik telah dipilih pada ', Morebits.htmlNode('strong', userNorm), '. Ini adalah bot tepercaya dan karenanya pembatalan ANB tidak akan dilanjutkan.' ]);
					return;
				case 'norm':
				/* falls through */
				default:
					var cont = confirm('Pembatalan biasa telah dipilih, tetapi suntingan baru-baru ini telah dilakukan oleh bot terpecaya (' + userNorm + '). Apakah anda ingin mengembalikkan revisi sebelumnya saja?');
					if (cont) {
						Morebits.Status.info('Info', [ 'Pembatalan biasa telah dipilih pada ', Morebits.htmlNode('strong', userNorm), '. Ini adalah bot tepercaya, tetapi berdasarkan konfirmasi, pengembalian pada revisi sebelumnya saja.' ]);
						index = 2;
						params.user = revs[1].user;
						params.userHidden = !!revs[1].userhidden;
						userNorm = params.user || Twinkle.rollback.hiddenName;
					} else {
						Morebits.Status.warn('Pemberitahuan', [ 'Pembatalan biasa telah dipilih pada ', Morebits.htmlNode('strong', userNorm), '. Ini adalah bot tepercaya, tetapi berdasarkan konfirmasi, pengembalian pada revisi yang dipilih akan dilanjutkan.' ]);
					}
					break;
			}
		}
		let found = false;
		let count = 0;
		let seen64 = false;

		for (let i = index; i < revs.length; ++i) {
			++count;
			if (revs[i].user !== params.user) {
				// Treat ipv6 users on same 64 block as the same
				if (mw.util.isIPv6Address(revs[i].user) && Morebits.ip.get64(revs[i].user) === Morebits.ip.get64(params.user)) {
					if (!seen64) {
						new Morebits.Status('Catatan', 'Memperlakukan alamat IPv6 berurutan di /64 yang sama dengan pengguna yang sama');
						seen64 = true;
					}
					continue;
				}
				found = i;
				break;
			}
		}

		if (!found) {
			statelem.error([ 'Tidak dapat ditemukan revisi sebelumnya. Mungkin ', Morebits.htmlNode('strong', params.user), ' adalah satu-satunya penyunting, atau pengguna tersebut telah melakukan  ' + mw.language.convertNumber(Twinkle.getPref('revertMaxRevisions')) + ' suntingan berturut-turut.' ]);
			return;
		}

		if (!count) {
			Morebits.Status.error('Error', 'Tidak bisa membatalkan nol revisi. Ini mungkin dikarenakan revisi tersebut telah dibatalkan namun penanda revisi masih tetap sama.');
			return;
		}

		const good_revision = revs[found];
		let userHasAlreadyConfirmedAction = false;
		if (params.type !== 'vand' && count > 1) {
			if (!confirm(userNorm + ' telah membuat ' + mw.language.convertNumber(count) + ' penyuntingan beruntun. Apakah anda ingin membatalkan semuanya?')) {
				Morebits.Status.info('Pemberitahuan', 'Membatalkan pembalikan.');
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		params.count = count;

		params.goodid = good_revision.revid;
		params.gooduser = good_revision.user;
		params.gooduserHidden = !!good_revision.userhidden;

		statelem.status([ ' revisi ', Morebits.htmlNode('strong', params.goodid), ' yang dibuat ', Morebits.htmlNode('strong', mw.language.convertNumber(count)), ' revisi yang lalu oleh ', Morebits.htmlNode('strong', params.gooduserHidden ? Twinkle.rollback.hiddenName : params.gooduser) ]);

		let summary, extra_summary;
		switch (params.type) {
			case 'agf':
				extra_summary = prompt('Komentar tambahan untuk ringkasan suntingan:                              ', ''); // padded out to widen prompt in Firefox
				if (extra_summary === null) {
					statelem.error('Dibatalkan oleh pengguna.');
					return;
				}
				userHasAlreadyConfirmedAction = true;

				summary = Twinkle.rollback.formatSummary('Membatalkan suntingan [[WP:ANB|berniat baik]] oleh $USER',
					params.userHidden ? null : params.user, extra_summary || '');
				break;

			case 'vand':
				summary = Twinkle.rollback.formatSummary('Membatalkan ' + params.count + ' suntingan oleh $USER ke revisi terakhir oleh ' +
					(params.gooduserHidden ? Twinkle.rollback.hiddenName : params.gooduser), params.userHidden ? null : params.user);
				break;

			case 'norm':
			/* falls through */
			default:
				if (Twinkle.getPref('offerReasonOnNormalRevert')) {
					extra_summary = prompt('Komentar tambahan untuk ringkasan suntingan:                              ', ''); // padded out to widen prompt in Firefox
					if (extra_summary === null) {
						statelem.error('Dibatalkan oleh pengguna.');
						return;
					}
					userHasAlreadyConfirmedAction = true;
				}

				summary = Twinkle.rollback.formatSummary('Membatalkan ' + params.count + ' suntingan ' + ' oleh $USER',
					params.userHidden ? null : params.user, extra_summary || '');
				break;
		}

		const needToDisplayConfirmation =
			(
				Twinkle.getPref('confirmOnRollback') ||
				(
					Twinkle.getPref('confirmOnMobileRollback') &&
					// Mobile user agent taken from [[en:MediaWiki:Gadget-confirmationRollback-mobile.js]]
					/Android|webOS|iPhone|iPad|iPod|BlackBerry|Mobile|Opera Mini/i.test(navigator.userAgent)
				)
			) &&
			!userHasAlreadyConfirmedAction;

		if (needToDisplayConfirmation && !confirm('Balikkan halaman: apakah anda yakin?')) {
			statelem.error('Dibatalkan oleh pengguna.');
			return;
		}

		// Decide whether to notify the user on success
		if (!Twinkle.rollback.skipTalk && Twinkle.getPref('openTalkPage').includes(params.type) &&
				!params.userHidden && mw.config.get('wgUserName') !== params.user) {
			params.notifyUser = true;
			// Pass along to the warn module
			params.vantimestamp = top.timestamp;
		}

		// figure out whether we need to/can review the edit
		const flagged = page.flagged;
		if ((Morebits.userIsInGroup('reviewer') || Morebits.userIsSysop) &&
				!!flagged &&
				flagged.stable_revid >= params.goodid &&
				!!flagged.pending_since) {
			params.reviewRevert = true;
			params.csrftoken = csrftoken;
		}

		const query = {
			action: 'edit',
			title: params.pagename,
			summary: summary,
			tags: Twinkle.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: params.goodid,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: Twinkle.getPref('markRevertedPagesAsMinor').includes(params.type) ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (Twinkle.getPref('watchRevertedPages').includes(params.type)) {
			const watchOrExpiry = Twinkle.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in Twinkle.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		if (!Twinkle.rollback.rollbackInPlace) {
			Morebits.wiki.actionCompleted.redirect = params.pagename;
		}
		Morebits.wiki.actionCompleted.notice = 'Pembalikkan selesai';

		const wikipedia_api = new Morebits.wiki.Api('Menyimpan konten pembatalan', query, Twinkle.rollback.callbacks.complete, statelem);
		wikipedia_api.params = params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		// TODO Most of this is copy-pasted from Morebits.wiki.Page#fnSaveSuccess. Unify it
		const response = apiobj.getResponse();
		const edit = response.edit;

		if (edit.captcha) {
			apiobj.statelem.error('Tidak dapat dibalikkan, dikarenakan peladen wiki mengharuskan anda mengisi CAPTCHA.');
		} else if (edit.nochange) {
			apiobj.statelem.error('Revisi yang dibatalkan sama dengan revisi sekarang, membatalkan.');
		} else {
			if (!Twinkle.getPref('rollbackInPlace')) {
                $('#catlinks').remove();
            }
			apiobj.statelem.info('done');
			const params = apiobj.params;

			if (params.notifyUser && !params.userHidden) { // notifyUser only from main, not from toRevision
				Morebits.Status.info('Info', [ 'Membuka halaman suntingan pembicaraan pengguna untuk pengguna ', Morebits.htmlNode('strong', params.user) ]);

				const url = mw.util.getUrl('Pembicaraan pengguna:' + params.user, {
					action: 'edit',
					preview: 'yes',
					vanarticle: params.pagename.replace(/_/g, ' '),
					vanarticlerevid: params.revid,
					vantimestamp: params.vantimestamp,
					vanarticlegoodrevid: params.goodid,
					type: params.type,
					count: params.count
				});

				switch (Twinkle.getPref('userTalkPageMode')) {
					case 'tab':
						window.open(url, '_blank');
						break;
					case 'blank':
						window.open(url, '_blank',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
					case 'window':
					/* falls through */
					default:
						window.open(url,
							window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
				}
			// prefill Wel/ARV/Warn when rollback used on Special:Contributions page
			} else if (Twinkle.rollback.rollbackInPlace &&
				mw.config.get('wgCanonicalSpecialPageName') === 'Contributions') {
				Twinkle.setPrefill('vanarticle', params.pagename.replace(/_/g, ' '));
				Twinkle.setPrefill('vanarticlerevid', params.revid);
				Twinkle.setPrefill('vantimestamp', params.vantimestamp);
				Twinkle.setPrefill('vanarticlegoodrevid', params.goodid);
			}

			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				const query = {
					action: 'review',
					revid: edit.newrevid,
					token: apiobj.params.csrftoken,
					comment: 'Otomatis menerima pengembalian' + Twinkle.summaryAd // until the below
					// 'tags': Twinkle.changeTags // flaggedrevs tag support: [[phab:T247721]]
				};
				const wikipedia_api = new Morebits.wiki.Api('Otomatis menerima suntingan Anda', query);
				wikipedia_api.post();
			}
		}
	}
};

// If builtInString contains the string "$USER", it will be replaced
// by an appropriate user link if a user name is provided
Twinkle.rollback.formatSummary = function(builtInString, userName, customString) {
	let result = builtInString;

	// append user's custom reason
	if (customString) {
		result += ': ' + Morebits.string.toUpperCaseFirstChar(customString);
	}

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 499-byte limit
	if (/\$USER/.test(builtInString)) {
		if (userName) {
			const resultLen = unescape(encodeURIComponent(result.replace('$USER', ''))).length;
			const contribsLink = '[[Istimewa:Kontribusi/' + userName + '|' + userName + ']]';
			const contribsLen = unescape(encodeURIComponent(contribsLink)).length;
			if (resultLen + contribsLen <= 499) {
				const talkLink = ' ([[Pembicaraan pengguna:' + userName + '|' + Morebits.i18n.getMessage('talk-link-text', 'bicara') + ']])';
				if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 499) {
					result = Morebits.string.safeReplace(result, '$USER', contribsLink + talkLink);
				} else {
					result = Morebits.string.safeReplace(result, '$USER', contribsLink);
				}
			} else {
				result = Morebits.string.safeReplace(result, '$USER', userName);
			}
		} else {
			result = Morebits.string.safeReplace(result, '$USER', Twinkle.rollback.hiddenName);
		}
	}

	return result;
	};

Twinkle.addInitCallback(Twinkle.rollback, 'rollback');
}());

// </nowiki>
