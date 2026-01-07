// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles, files which are not redirects
 */

Twinkle.prod = function twinkleprod() {
	if ((![0, 6].includes(mw.config.get('wgNamespaceNumber'))) ||
		!mw.config.get('wgCurRevisionId') ||
		Morebits.isPageRedirect()) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.prod.callback, 'UP', 'tw-prod', 'Mengusulkan penghapusan lewat WP:UP');
};

// Used in edit summaries, for comparisons, etc.
let namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
		// no default
	}

	const Window = new Morebits.SimpleWindow(800, 410);
	Window.setTitle('Usulan penghapusan (UP)');
	Window.setScriptName('Twinkle');

	const form = new Morebits.QuickForm(Twinkle.prod.callback.evaluate);

	if (namespace === 'article') {
		Window.addFooterLink('Kebijakan usulan penghapusan', 'WP:UP');
		Window.addFooterLink('Kebijakan UP BIO', 'WP:HIDUP');
	} else { // if file
		Window.addFooterLink('Kebijakan usulan penghapusan', 'WP:UP');
	}

	const field = form.append({
		type: 'field',
		label: 'Jenis UP',
		id: 'prodtype_fieldset'
	});

	field.append({
		type: 'div',
		label: '', // Added later by Twinkle.makeFindSourcesDiv()
		id: 'twinkle-prod-findsources',
		style: 'margin-bottom: 5px; margin-top: -5px;'
	});

	field.append({
		type: 'radio',
		name: 'prodtype',
		event: Twinkle.prod.callback.prodtypechanged,
		list: [
			{
				label: 'UP (Usulan penghapusan)',
				value: 'prod',
				checked: true,
				tooltip: 'Usulan penghapusan biasa, per [[WP:UP]]'
			},
			{
				label: 'UP BIO (Usulan penghapusan untuk BIO tidak ada sumber)',
				value: 'prodblp',
				tooltip: 'Usulan penghapusan biografi orang hidup baru tanpa sumber, per [[WP:BIO]]'
			}
		]
	});

	// Placeholder fieldset to be replaced in Twinkle.prod.callback.prodtypechanged
	form.append({
		type: 'field',
		name: 'parameters'
	});

	Window.addFooterLink('Preferensi UP', 'WP:TW/PREF#prod');
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#prod');
	Window.addFooterLink('Berikan umpan balik', 'WT:TW');

	form.append({ type: 'submit', label: 'Usulan penghapusan' });

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// Hide fieldset for File PROD type since only normal PROD is allowed
	if (namespace !== 'article') {
		$(result).find('#prodtype_fieldset').hide();
	}

	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.prodtype[0].dispatchEvent(evt);

};

Twinkle.prod.callback.prodtypechanged = function(event) {
	// prepare frame for prod type dependant controls
	const field = new Morebits.QuickForm.Element({
		type: 'field',
		label: 'Parameter',
		name: 'parameters'
	});
	// create prod type dependant controls
	switch (event.target.values) {
		case 'prod':
			field.append({
				type: 'checkbox',
				list: [
					{
						label: 'Beritahu pembuat halaman',
						value: 'notify',
						name: 'notify',
						tooltip: "Templat notifikasi akan ditempatkan di halaman pembicaraan pembuat halaman.",
						checked: true
					}
				]
			});
			field.append({
				type: 'textarea',
				name: 'reason',
				label: 'Alasan penghapusan:',
				value: Twinkle.prod.defaultReason
			});
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case they want to switch back. We can abuse the config field for that.
			if (event.target.form.reason) {
				Twinkle.prod.defaultReason = event.target.form.reason.value;
			}

			field.append({
				type: 'checkbox',
				list: [
					{
						label: 'Beritahu pembuat halaman',
						value: 'notify',
						name: 'notify',
						tooltip: 'Pembuat artikel harus diberitahu.',
						checked: true,
						disabled: true
					}
				]
			});
			// temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Catatan, hanya biografi orang hidup tanpa sumber diberi tag ini.'));
			field.append({
				type: 'div',
				label: boldtext
			});
			break;

		default:
			break;
	}

	Twinkle.makeFindSourcesDiv('#twinkle-prod-findsources');

	event.target.form.replaceChild(field.render(), $(event.target.form).find('fieldset[name="parameters"]')[0]);
};

// global params object, initially set in evaluate(), and
// modified in various callback functions
let params = {};

Twinkle.prod.callbacks = {
	checkPriors: function twinkleprodcheckPriors() {
		const talk_title = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
		// Talk page templates for PROD-able discussions
		const blocking_templates = 'Templat:Old XfD multi|Templat:Old MfD|Templat:Oldffdfull|' + // Common prior XfD talk page templates
			'Templat:Oldpuffull|' + // Legacy prior XfD template
			'Templat:Olddelrev|' + // Prior DRV template
			'Templat:Old prod';
		const query = {
			action: 'query',
			titles: talk_title,
			prop: 'templates',
			tltemplates: blocking_templates,
			format: 'json'
		};

		const wikipedia_api = new Morebits.wiki.Api('Memeriksa halaman pembicaraan untuk nominasi sebelumnya', query);
		return wikipedia_api.post().then((apiobj) => {
			const statelem = apiobj.statelem;

			// Check talk page for templates indicating prior XfD or PROD
			const templates = apiobj.getResponse().query.pages[0].templates;
			const numTemplates = templates && templates.length;
			if (numTemplates) {
				const template = templates[0].title;
				if (numTemplates === 1 && template === 'Templat:Old prod') {
					params.oldProdPresent = true; // Mark for reference later, when deciding if to endorse
				// if there are multiple templates, at least one of them would be a prior xfd template
				} else {
					statelem.warn('Templat XfD sebelumnya telah ditemukan di halaman pembicaraan, membatalkan');
					return $.Deferred().reject();
				}
			}
		});
	},

	fetchCreationInfo: function twinkleprodFetchCreationInfo() {
		const def = $.Deferred();
		const ts = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Mencari pembuat halaman');
		ts.setFollowRedirect(true); // for NPP, and also because redirects are ineligible for PROD
		ts.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
		ts.lookupCreation((pageobj) => {
			params.initialContrib = pageobj.getCreator();
			params.creation = pageobj.getCreationTimestamp();
			pageobj.getStatusElement().info('Selesai, ditemukan ' + params.initialContrib);
			def.resolve();
		}, def.reject);
		return def;
	},

	taggingPage: function twinkleprodTaggingPage() {
		const def = $.Deferred();
		const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Menandai halaman');
		wikipedia_page.setFollowRedirect(true); // for NPP, and also because redirects are ineligible for PROD
		wikipedia_page.load((pageobj) => {
			const statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("Sepertinya halamannya tidak ada. Mungkin telah dihapus.");
				// reject, so that all dependent actions like notifyAuthor() and
				// addToLog() are cancelled
				return def.reject();
			}

			let text = pageobj.getPageText();

			// Check for already existing deletion tags
			const tag_re = /{{(?:article for deletion\/dated|AfDM|ffd\b)|#invoke:RfD/i;
			if (tag_re.test(text)) {
				statelem.warn('Halaman telah ditandai dengan templat penghapusan, membatalkan');
				return def.reject();
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/{{\s*(userspace draft|mtc|(copy|move) ke wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, '');
			const prod_re = /{{\s*(?:Prod blp|Usulan penghapusan)\/dated(?: files)?\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
			let summaryText;

			if (!prod_re.test(text)) {

				// Page previously PROD-ed
				if (params.oldProdPresent) {
					if (params.blp) {
						if (!confirm('Nominasi UP ditemukan di halaman pembicaraan. Apakah anda masih ingin menambahkan BIO? ')) {
							statelem.warn('Usulan telah ditemukan di halaman pengguna,, dibatalkan oleh pengguna');
							return def.reject();
						}
						statelem.info('Usulan telah ditemukan di halaman pengguna, melanjutkan');
					} else {
						statelem.warn('Usulan telah ditemukan di halaman pengguna, membatalkan');
						return def.reject();
					}
				}

				let tag;
				if (params.blp) {
					summaryText = 'Mengusulkan penghapusan artikel per [[WP:UP]].';
					tag = '{{subst:prod blp' + (params.usertalk ? '|help=off' : '') + '}}';
				} else {
					summaryText = 'Mengusulkan ' + namespace + ' untuk dihapus per [[WP:UP]].';
					tag = '{{subst:prod|1=' + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? '|help=off' : '') + '}}';
				}

				// Insert tag after short description or any hatnotes
				const wikipage = new Morebits.wikitext.Page(text);
				text = wikipage.insertAfterTemplates(tag + '\n', Twinkle.hatnoteRegex).getText();

			} else { // already tagged for PROD, so try endorsing it
				const prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/i;
				if (prod2_re.test(text)) {
					statelem.warn('Halaman telah ditandai dengan templat {{proposed deletion}} dan {{proposed deletion endorsed}}, membatalkan');
					return def.reject();
				}
				let confirmtext = 'Sebuah tag {{proposed deletion}} telah ditemukan di halaman. \nApakah anda ingin memberikan tag {{proposed deletion endorsed}} dengan penjelasan anda?';
				if (params.blp && !/{{\s*Prod blp\/dated/.test(text)) {
					confirmtext = 'Sebuah tag {{proposed deletion}} non-BLP ditemukan di artikel.\nApakah anda ingin memberikan tag {{proposed deletion endorsed}} dengan penjelasan "artikel merupakan biografi orang hidup tanpa sumber"?';
				}
				if (!confirm(confirmtext)) {
					statelem.warn('Dibatalkan atas permintaan');
					return def.reject();
				}

				summaryText = 'Pengusulan per [[WP:' + (params.blp ? 'BLP' : '') + 'UP]].';
				text = text.replace(prod_re, text.match(prod_re) + '\n{{Proposed deletion endorsed|1=' + (params.blp ?
					'artikel merupakan [[WP:HIDUP|biografi orang hidup tanpa sumber]]' :
					Morebits.string.formatReasonText(params.reason)) + '}}\n');

				params.logEndorsing = true;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary(summaryText);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchProdPages'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(def.resolve, def.reject);

			// curate/patrol the page
			if (Twinkle.getPref('markProdPagesAsPatrolled')) {
				pageobj.triage();
			}

		}, def.reject);
		return def;
	},

	createNominationPage: function twinkleprodCreateNominationPage() {
		const def = $.Deferred();
		const nomTitle = 'Wikipedia:Usulan penghapusan/' + Morebits.pageNameNorm;
		const page = new Morebits.wiki.Page(nomTitle, 'Membuat halaman usulan UP');

		// Cek apakah halaman sudah ada
		page.load((pageobj) => {
			if (pageobj.exists()) {
				Morebits.Status.info('Halaman usulan', 'Halaman usulan sudah ada, melewati pembuatan.');
				def.resolve();
				return;
			}
			const text = '{{subst:Usul penghapusan/UP|alasan=' + params.reason + '}} ~~~~\n';

			page.setPageText(text);
			page.setEditSummary('Membuat halaman usulan penghapusan untuk [[:' + Morebits.pageNameNorm + ']].');
			page.setChangeTags(Twinkle.changeTags);
			page.setCreateOption('createonly');
			page.save(def.resolve, def.reject);
		}, def.reject);

		return def;
	},

	addOldProd: function twinkleprodAddOldProd() {
		const def = $.Deferred();

		if (params.oldProdPresent || params.blp) {
			return def.resolve();
		}

		// Add {{Old prod}} to the talk page
		const oldprodfull = '{{Old prod|nom=' + mw.config.get('wgUserName') + '|nomdate={{subst:#time: Y-m-d}}}}\n';
		const talktitle = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
		const talkpage = new Morebits.wiki.Page(talktitle, 'Menambahkan {{Old prod}} di halaman pembicaraan');
		talkpage.setPrependText(oldprodfull);
		talkpage.setEditSummary('Ditambahkan {{Old prod}}');
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.setFollowRedirect(true); // match behavior for page tagging
		talkpage.setCreateOption('recreate');
		talkpage.prepend(def.resolve, def.reject);
		return def;
	},

	notifyAuthor: function twinkleprodNotifyAuthor() {
		const def = $.Deferred();

		if (!params.blp && !params.usertalk) {
			return def.resolve();
		}

		// Disallow warning yourself
		if (params.initialContrib === mw.config.get('wgUserName')) {
			Morebits.Status.info('Beritahu pembuat', 'Anda (' + params.initialContrib + ') membuat halaman ini; melewati notifikasi pengguna');
			return def.resolve();
		}
		// [[Template:Proposed deletion notify]] supports File namespace
		let notifyTemplate;
		if (params.blp) {
			notifyTemplate = 'prodwarningBLP';
		} else {
			notifyTemplate = 'proposed deletion notify';
		}
		const notifytext = '\n{{subst:' + notifyTemplate + '|1=' + Morebits.pageNameNorm + '|concern=' + params.reason + '}} ~~~~';

		const usertalkpage = new Morebits.wiki.Page('Pembicaraan pengguna:' + params.initialContrib, 'Memberitahu kontributor awal (' + params.initialContrib + ')');
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary('Notifikasi: mengusulkan penghapusan dari [[:' + Morebits.pageNameNorm + ']].');
		usertalkpage.setChangeTags(Twinkle.changeTags);
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true, false);
		usertalkpage.append(() => {
			// add nomination to the userspace log, if the user has enabled it
			params.logInitialContrib = params.initialContrib;
			def.resolve();
		}, def.resolve); // resolves even if notification was unsuccessful

		return def;
	},

	addToLog: function twinkleprodAddToLog() {
		if (!Twinkle.getPref('logProdPages')) {
			return $.Deferred().resolve();
		}
		const usl = new Morebits.UserspaceLogger(Twinkle.getPref('prodLogPageName'));
		usl.initialText =
			"Ini adalah sebuah log dari semua tag [[WP:UP|usulan penghapusan]] yang dipasang oleh pengguan ini dengan modul UP [[WP:TW|Twinkle]].\n\n" +
			'Jika anda tidak ingin menyimpan catatan ini lagi, anda dapat mematikannya di [[Wikipedia:Twinkle/Preferences|panel preferensi]], dan ' +
			'nominasikan halaman ini untuk penghapusan cepat dibawah [[WP:KPC#H1|KPC H1]].';

		let logText = '# [[:' + Morebits.pageNameNorm + ']]';
		let summaryText;
		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		logText += namespace === 'file' ? ' ([{{fullurl:Istimewa:Catatan|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} catata]): ' : ': ';
		if (params.logEndorsing) {
			logText += 'mendukung ' + (params.blp ? 'BIO ' : '') + 'UP. ~~~~~';
			if (params.reason) {
				logText += "\n#* '''Alasan''': " + params.reason + '\n';
			}
			summaryText = 'Mencatat nominasi UP dari [[:' + Morebits.pageNameNorm + ']].';
		} else {
			logText += (params.blp ? 'BIO ' : '') + 'UP';
			if (params.logInitialContrib) {
				logText += '; diberitahu {{user|' + params.logInitialContrib + '}}';
			}
			logText += ' ~~~~~\n';
			if (!params.blp && params.reason) {
				logText += "#* '''Alasan''': " + Morebits.string.formatReasonForLog(params.reason) + '\n';
			}
			summaryText = 'Mencatat nominasi UP dari [[:' + Morebits.pageNameNorm + ']].';
		}
		usl.changeTags = Twinkle.changeTags;

		return usl.log(logText, summaryText);
	}

};

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	const form = e.target;
	const input = Morebits.QuickForm.getInputData(form);

	params = {
		usertalk: input.notify || input.prodtype === 'prodblp',
		blp: input.prodtype === 'prodblp',
		reason: input.reason || '' // using an empty string here as fallback will help with prod-2.
	};

	if (!params.blp && !params.reason) {
		if (!confirm('Anda membiarkan bagian alasan kosong, apakah anda yakin ingin melanjutkan?')) {
			return;
		}
	}

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	const tm = new Morebits.TaskManager();
	const cbs = Twinkle.prod.callbacks; // shortcut reference, cbs for `callbacks`

	// Disable Morebits.wiki.numberOfActionsLeft system
	Morebits.wiki.numberOfActionsLeft = 1000;

	// checkPriors() and fetchCreationInfo() have no dependencies, they'll run first
	tm.add(cbs.checkPriors, []);
	tm.add(cbs.fetchCreationInfo, []);
	// tag the page once we're clear of the pre-requisites
	tm.add(cbs.taggingPage, [ cbs.checkPriors, cbs.fetchCreationInfo ]);
	tm.add(cbs.createNominationPage, [ cbs.taggingPage ]);

	// notify the author once we know who's the author, and also wait for the
	// taggingPage() as we don't need to notify if tagging was not done, such as
	// there was already a tag and the user chose not to endorse.
	tm.add(cbs.notifyAuthor, [ cbs.fetchCreationInfo, cbs.taggingPage ]);
	// oldProd needs to be added only if there wasn't one before, so need to wait
	// for checkPriors() to finish. Also don't add oldProd if tagging itself was
	// aborted or unsuccessful
	tm.add(cbs.addOldProd, [ cbs.taggingPage, cbs.checkPriors ]);
	// add to log only after notifying author so that the logging can be adjusted if
	// notification wasn't successful. Also, don't run if tagging was not done.
	tm.add(cbs.addToLog, [ cbs.notifyAuthor, cbs.taggingPage ]);
	// All set, go!
	tm.execute().then(() => {
		Morebits.Status.actionCompleted('Memberi tag selesai');
		setTimeout(() => {
			window.location.href = mw.util.getUrl(mw.config.get('wgPageName'));
		}, Morebits.wiki.actionCompleted.timeOut);
	});
};

Twinkle.addInitCallback(Twinkle.prod, 'prod');
}());

// </nowiki>
