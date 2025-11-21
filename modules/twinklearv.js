// <nowiki>

(function() {

/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = function twinklearv() {
	const username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	const isIP = mw.util.isIPAddress(username, true);
	// Ignore ranges wider than the CIDR limit
	if (Morebits.ip.isRange(username) && !Morebits.ip.validCIDR(username)) {
		return;
	}
	const userType = isIP ? (Morebits.ip.isRange(username) ? 'Rentang IP' : 'IP') : 'pengguna';

	Twinkle.addPortletLink(() => {
		Twinkle.arv.callback(username, isIP);
	}, 'Lapor', 'tw-arv', 'Laporkan ' + userType + ' ke pengurus');
};

Twinkle.arv.callback = function (uid, isIP) {
	const Window = new Morebits.SimpleWindow(600, 500);
	Window.setTitle('Pelaporan dan Pemeriksaan Lanjutan'); // Backronym ARV
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Intervensi pengurus (Vandalisme)', 'WP:IPTV');
	Window.addFooterLink('Kebijakan nama pengguna', 'WP:NAMA');
	Window.addFooterLink('Investigasi pengguna siluman', 'WP:IPS');
	Window.addFooterLink('Preferensi ARV', 'WP:TW/PREF#arv');
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#arv');
	Window.addFooterLink('Berikan umpan balik', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.arv.callback.evaluate);
	const categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Pilih jenis laporan: ',
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: 'Vandalisme (WP:IPTV)',
		value: 'aiv'
	});
	categories.append({
		type: 'option',
		label: 'Nama pengguna (WP:UAA)',
		value: 'username',
		disabled: isIP
	});
	categories.append({
		type: 'option',
		label: 'Induk akun kedua (WP:IPS)',
		value: 'sock'
	});
	categories.append({
		type: 'option',
		label: 'Akun kedua (WP:IPS)',
		value: 'puppet'
	});
	categories.append({
		type: 'option',
		label: 'Perang suntingan (WP:AN3)',
		value: 'an3',
		disabled: Morebits.ip.isRange(uid)
	});
	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-arv-blockwarning'
	});
		// Pemberitahuan ke akun sementara
	if (mw.config.get('wgRelevantUserName') && mw.util.isTemporaryUser(mw.config.get('wgRelevantUserName')) && !mw.config.get('wgCheckUserTemporaryAccountIPRevealAllowed')) {
		const temporaryAccountNotice = form.append({
			type: 'field',
			label: 'Beritahu pengguna sementara',
			name: 'ta_notice',
			style: 'color: var(--morebits-color-warning, #FF4500)'
		});

		temporaryAccountNotice.append({
			type: 'div',
			label: 'Anda melaporkan sebuah [[Wikipedia:Akun sementara|akun sementara]]. Akun-akun ini, dengan nama pengguna seperti ~2025-12345-67, menggantikan alamat IP. Mohon berhati-hati saat melaporkan dugaan penggunaan akun ganda dan saat pemblokiran, dikarenakan pengguna lain dan akun sementara di alamat IP yang sama dapat berakhir dengan kerusakan kolateral (pemblokiran bersama).'
		});
	}
	form.append({
		type: 'field',
		label: 'Lingkup kerja',
		name: 'work_area'
	});
	form.append({ type: 'submit' });
	form.append({
		label: 'Kirim',
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// Check if the user is blocked, update notice
	const query = {
		action: 'query',
		list: 'blocks',
		bkprop: 'range|flags',
		format: 'json'
	};
	if (isIP) {
		query.bkip = uid;
	} else {
		query.bkusers = uid;
	}
	new Morebits.wiki.Api("Memeriksa status pemblokiran pengguna", query, ((apiobj) => {
		const blocklist = apiobj.getResponse().query.blocks;
		if (blocklist.length) {
			// If an IP is blocked *and* rangeblocked, only use whichever is more recent
			const block = blocklist[0];
			let message = (isIP ? (Morebits.ip.isRange(uid) ? 'Rentang ' : 'Alamat ' + 'IP ini ') : 'Akun ini ') + (block.partial ? 'sedang diblokir parsial' : 'sedang diblokir');
			// Start and end differ, range blocked
			message += block.rangestart !== block.rangeend ? ' sebagai bagian dari pemblokiran rentang (rangeblock).' : '.';
			if (block.partial) {
				$('#twinkle-arv-blockwarning').css('color', 'black'); // Less severe
			}
			$('#twinkle-arv-blockwarning').text(message);
		}
	})).post();

	// We must init the
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.callback.changeCategory = function (e) {
	const value = e.target.value;
	const root = e.target.form;
	const old_area = Morebits.QuickForm.getElements(root, 'work_area')[0];
	let work_area = null;

	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.QuickForm.Element({
				type: 'field',
				label: 'Laporkan pengguna pelaku vandalisme',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Pranala ke halaman yang divandal:',
				tooltip: 'Biarkan kosong jika Anda tidak ingin menautkan ke halaman dalam laporan',
				value: Twinkle.getPrefill('vanarticle') || '',
				event: function(e) {
					const value = e.target.value;
					const root = e.target.form;
					if (value === '') {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			});
			work_area.append({
				type: 'input',
				name: 'badid',
				label: 'ID revisi untuk halaman target ketika divandal:',
				tooltip: 'Biarkan kosong jika tidak ada tautan diff',
				value: Twinkle.getPrefill('vanarticlerevid') || '',
				disabled: !Twinkle.getPrefill('vanarticle'),
				event: function(e) {
					const value = e.target.value;
					const root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: 'ID revisi baik terakhir sebelum memvandal halaman target:',
				tooltip: 'Biarkan kosong untuk tautan diff ke revisi sebelumnya',
				value: Twinkle.getPrefill('vanarticlegoodrevid') || '',
				disabled: !Twinkle.getPrefill('vanarticle') || Twinkle.getPrefill('vanarticlerevid')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Vandalisme setelah peringatan akhir (tingkat 4 atau 4im) diberikan',
						value: 'final'
					},
					{
						label: 'Vandalisme setelah masa berlaku pemblokiran berakhir (dalam rentang waktu 1 hari)',
						value: 'postblock'
					},
					{
						label: 'Akun yang terbukti sebagai akun vandalisme semata',
						value: 'vandalonly',
						disabled: mw.util.isIPAddress(root.uid.value)
					},
					{
						label: 'Akun hanya digunakan untuk beriklan/promosi',
						value: 'promoonly',
						disabled: mw.util.isIPAddress(root.uid.value)
					},
					{
						label: 'Akun yang terbukti sebuah spambot atau akun terkompromi',
						value: 'spambot'
					}
				]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Komentar:'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'username':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Laporkan pelanggaran nama pengguna',
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: 'Jenis pelanggaran nama pengguna',
				tooltip: 'Wikipedia tidak mengizinkan nama pengguna yang menyesatkan, promosi, menyinggung, atau mengganggu. Nama domain dan alamat email juga dilarang. Kriteria ini berlaku untuk nama pengguna dan tanda tangan.'
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Nama pengguna yang menyesatkan',
						value: 'misleading',
						tooltip: 'Nama pengguna yang menyesatkan menyiratkan hal-hal yang relevan dan salah tentang kontributor. Misalnya, fakta-fakta yang menyesatkan, kesan otoritas yang tidak semestinya, atau nama pengguna yang memberi kesan akun bot.'
					},
					{
						label: 'Nama pengguna yang berbau promosi',
						value: 'promotional',
						tooltip: 'Nama pengguna promosi adalah iklan untuk sebuah perusahaan, situs web, atau grup. Harap jangan melaporkan nama-nama ini ke UAA kecuali jika pengguna yang dilaporkan telah melakukan penyuntingan promosi terkait dengan nama tersebut.'
					},
					{
						label: 'Nama pengguna yang menyiratkan penggunaan bersama',
						value: 'shared',
						tooltip: 'Nama pengguna yang menyiratkan kemungkinan penggunaan bersama (nama perusahaan atau grup, atau nama jabatan dalam organisasi) tidak diizinkan. Nama pengguna dapat diterima jika mengandung nama perusahaan atau grup tetapi dengan jelas dimaksudkan untuk menunjukkan seseorang, seperti "Mark di WidgetsUSA", "Jack Smith di Yayasan XY", "WidgetFan87", dll.'
					},
					{
						label: 'Nama pengguna yang ofensif (menghina/kotor)',
						value: 'offensive',
						tooltip: 'Nama pengguna yang ofensif membuat penyuntingan yang harmonis menjadi sulit atau bahkan tidak mungkin.'
					},
					{
						label: 'Nama pengguna yang mengganggu',
						value: 'disruptive',
						tooltip: 'Nama pengguna yang mengganggu termasuk melakukan hal jahil secara langsung atau serangan pribadi, atau menunjukkan niat yang jelas untuk mengganggu Wikipedia.'
					}
				]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Komentar:'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'puppet':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Laporkan akun kedua (puppet)',
				name: 'work_area'
			});
			work_area.append(
				{
					type: 'input',
					name: 'sockmaster',
					label: 'Induk akun kedua',
					tooltip: 'Tuliskan hanya nama pengguna dari induk akun kedua (dalang) tanpa awalan Pengguna:'
				}
			);
			work_area.append({
				type: 'textarea',
				label: 'Bukti:',
				name: 'evidence',
				tooltip: 'Bukti Anda harus jelas menunjukkan bahwa pengguna-pengguna ini menyalahgunakan beberapa akun. Biasanya hal ini berarti kemiripan pola suntingan, riwayat halaman atau informasi lainnya yang menjustifikasi mengapa penggunanya a) sama dan b) mengganggu. Hindari diskusi yang tidak membuktikan penggunaan akun ganda.'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Minta pemeriksaan teknis dari Pemeriksa (CheckUser)',
						name: 'checkuser',
						tooltip: 'CheckUser adalah alat untuk memperoleh bukti teknis (IP/User Agent). Alat ini tidak akan digunakan tanpa alasan yang kuat. Pastikan bukti Anda menjelaskan alasan penggunaan alat ini tepat.'
					},
					{
						label: 'Beritahu pengguna yang dilaporkan',
						name: 'notify',
						tooltip: 'Notifikasi tidak wajib. Dalam banyak kasus, terutama kasus penggunaan akun kedua kronis, notifikasi bisa jadi kontraproduktif.'
					}
				]
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'sock':
			work_area = new Morebits.QuickForm.Element({
				type: 'field',
				label: 'Laporkan induk pemilik akun kedua',
				name: 'work_area'
			});
			work_area.append(
				{
					type: 'dyninput',
					name: 'sockpuppets',
					label: 'Akun kedua:',
					sublabel: 'Akun:',
					tooltip: 'Nama pengguna dari akun kedua tanpa awalan "Pengguna:"',
					min: 2
				});
			work_area.append({
				type: 'textarea',
				label: 'Bukti:',
				name: 'evidence',
				tooltip: 'Bukti Anda harus memperjelas bahwa masing-masing pengguna ini kemungkinan menyalahgunakan beberapa akun. Biasanya ini berarti perbedaan, riwayat halaman, atau informasi lain yang membenarkan mengapa pengguna tersebut a) sama dan b) mengganggu.'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'an3':
			work_area = new Morebits.QuickForm.Element({
				type: 'field',
				label: 'Laporkan perang suntingan (3RR)',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Halaman',
				tooltip: 'Halaman yang sedang dilaporkan'
			});
			work_area.append({
				type: 'button',
				name: 'load',
				label: 'Muat',
				event: function(e) {
					const root = e.target.form;

					const date = new Morebits.Date().subtract(48, 'hours'); // all since 48 hours

					// Run for each AN3 field
					const getAN3Entries = function(field, rvuser, titles) {
						const $field = $(root).find('[name=' + field + ']');
						$field.find('.entry').remove();

						new mw.Api().get({
							action: 'query',
							prop: 'revisions',
							format: 'json',
							rvprop: 'sha1|ids|timestamp|parsedcomment|comment',
							rvlimit: 500, // intentionally limited
							rvend: date.toISOString(),
							rvuser: rvuser,
							indexpageids: true,
							titles: titles
						}).done((data) => {
							const pageid = data.query.pageids[0];
							const page = data.query.pages[pageid];
							if (!page.revisions) {
								$('<span class="entry">Tidak ditemukan</span>').appendTo($field);
							} else {
								for (let i = 0; i < page.revisions.length; ++i) {
									const rev = page.revisions[i];
									const $entry = $('<div>', {
										class: 'entry'
									});
									const $input = $('<input>', {
										type: 'checkbox',
										name: 's_' + field,
										value: JSON.stringify(rev)
									});
									$input.data('revinfo', rev);
									$input.appendTo($entry);
									let comment = '<span>';
									// revdel/os
									if (typeof rev.commenthidden === 'string') {
										comment += '(komentar tersembunyi)';
									} else {
										comment += '"' + rev.parsedcomment + '"';
									}
									comment += ' pada <a href="' + mw.config.get('wgScript') + '?diff=' + rev.revid + '">' + new Morebits.Date(rev.timestamp).calendar() + '</a></span>';
									$entry.append(comment).appendTo($field);
								}
							}

							// add free form input for resolves
							if (field === 'resolves') {
								const $free_entry = $('<div>', {
									class: 'entry'
								});
								const $free_input = $('<input>', {
									type: 'text',
									name: 's_resolves_free'
								});
								const $free_label = $('<label>', {
									for: 's_resolves_free',
									html: 'Pranala URL diff dengan diskusi tambahan: '
								});
								$free_entry.append($free_label).append($free_input).appendTo($field);
							}
						}).fail(() => {
							$('<span class="entry">API gagal, muat ulang halaman dan coba lagi</span>').appendTo($field);
						});
					};

					// warnings
					const uid = root.uid.value;
					getAN3Entries('warnings', mw.config.get('wgUserName'), 'Pembicaraan pengguna:' + uid);

					// diffs and resolves require a valid page
					const page = root.page.value;
					if (page) {
						// diffs
						getAN3Entries('diffs', uid, page);

						// resolutions
						const t = new mw.Title(page);
						const talk_page = t.getTalkPage().getPrefixedText();
						getAN3Entries('resolves', mw.config.get('wgUserName'), talk_page);
					} else {
						$(root).find('[name=diffs]').find('.entry').remove();
						$(root).find('[name=resolves]').find('.entry').remove();
					}
				}
			});
			work_area.append({
				type: 'field',
				name: 'diffs',
				label: 'Pengembalian (revert) oleh pengguna (dalam 48 jam terakhir)',
				tooltip: 'Pilih suntingan yang Anda yakin adalah pengembalian/revert'
			});
			work_area.append({
				type: 'field',
				name: 'warnings',
				label: 'Peringatan yang diberikan ke subjek',
				tooltip: 'Anda harus memperingatkan subjek terlebih dahulu sebelum melaporkan'
			});
			work_area.append({
				type: 'field',
				name: 'resolves',
				label: 'Inisiatif penyelesaian',
				tooltip: 'Anda harus mencoba untuk menyelesaikan permasalahan terlebih dahulu di halaman pembicaraan'
			});

			work_area.append({
				type: 'textarea',
				label: 'Komentar:',
				name: 'comment'
			});

			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

Twinkle.arv.callback.evaluate = function(e) {
	const form = e.target;
	let reason = '';
	const input = Morebits.QuickForm.getInputData(form);
	switch (input.category) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			reason = Twinkle.arv.callback.getAivReasonWikitext(input);

			if (reason === null) {
				alert('Anda harus menyertakan alasan');
				return;
			}

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Intervensi pengurus terhadap vandalisme';
			Morebits.wiki.actionCompleted.notice = 'Pelaporan selesai';

			var aivPage = new Morebits.wiki.Page('Wikipedia:Intervensi pengurus terhadap vandalisme', 'Memproses permintaan IPTV');
			aivPage.setPageSection(1);
			aivPage.setFollowRedirect(true);

			aivPage.load(() => {
				const text = aivPage.getPageText();
				const $aivLink = '<a target="_blank" href="/wiki/WP:AIV">WP:IPTV</a>';

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(text)) {
					aivPage.getStatusElement().error('Telah ada laporan, tidak akan membuatnya lagi');
					Morebits.Status.printUserText(reason, 'Komentar yang Anda ketik disediakan di bawah ini, jika Anda ingin menambahkannya secara manual di bawah pelaporan yang sudah ada untuk pengguna ini di ' + $aivLink + ':');
					return;
				}

				// then check for any bot reports
				const tb2Page = new Morebits.wiki.Page('Wikipedia:Intervensi pengurus terhadap vandalisme/TB2', 'Memeriksa laporan bot');
				tb2Page.load(() => {
					const tb2Text = tb2Page.getPageText();
					const tb2statelem = tb2Page.getStatusElement();

					if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(tb2Text)) {
						if (confirm('Pengguna ' + input.uid + ' telah dilaporkan oleh sebuah bot. Apakah Anda ingin tetap melaporkannya?')) {
							tb2statelem.info('Melaporkan walau dilaporkan bot');
						} else {
							tb2statelem.error('Laporan dari bot sudah ada, berhenti');
							Morebits.Status.printUserText(reason, 'Komentar yang Anda berikan tersedia di bawah ini, jika Anda ingin menambahkannya secara manual di ' + $aivLink + ':');
							return;
						}
					} else {
						tb2statelem.info('Tidak ada laporan bot yang konflik');
					}

					aivPage.getStatusElement().status('Menambahkan laporan baru...');
					aivPage.setEditSummary('Melaporkan [[Istimewa:Kontribusi/' + input.uid + '|' + input.uid + ']].');
					aivPage.setChangeTags(Twinkle.changeTags);
					aivPage.setAppendText(Twinkle.arv.callback.buildAivReport(input));
					aivPage.append();
				});
			});
			break;

		// Report inappropriate username
		case 'username':
			var censorUsername = input.arvtype.includes('offensive'); // check if the username is marked offensive

			reason = Twinkle.arv.callback.getUsernameReportWikitext(input);

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Permintaan perhatian nama pengguna';
			Morebits.wiki.actionCompleted.notice = 'Melaporkan selesai';

			var uaaPage = new Morebits.wiki.Page('Wikipedia:Permintaan perhatian nama pengguna', 'Memproses permintaan UAA');
			uaaPage.setFollowRedirect(true);

			uaaPage.load(() => {
				const text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(input.uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error('Laporan pengguna sudah ada.');
					const $uaaLink = '<a target="_blank" href="/wiki/WP:UAA">WP:UAA</a>';
					Morebits.Status.printUserText(reason, 'Komentar yang Anda berikan tersedia di bawah ini, jika Anda ingin menambahkannya secara manual di bawah pelaporan yang sudah ada untuk pengguna ini di ' + $uaaLink + ':');
					return;
				}
				uaaPage.getStatusElement().status('Menambahkan laporan baru...');
				uaaPage.setEditSummary('Melaporkan ' + (censorUsername ? 'sebagai nama pengguna ofensif.' : '[[Istimewa:Kontribusi/' + input.uid + '|' + input.uid + ']].'));
				uaaPage.setChangeTags(Twinkle.changeTags);

				// Blank newline per [[Special:Permalink/996949310#Spacing]]; see also [[WP:LISTGAP]] and [[WP:INDENTGAP]]
				uaaPage.setPageText(text + '\n' + reason + '\n*');
				uaaPage.save();
			});
			break;

		// WP:SPI
		case 'sock':
			/* falls through */
		case 'puppet':
			var reportData = Twinkle.arv.callback.getSpiReportData(input);

			if (reportData.error) {
				alert(reportData.error);
				return;
			}

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

			var reportpage = 'Wikipedia:Investigasi pengguna siluman/' + reportData.sockmaster;

			Morebits.wiki.actionCompleted.redirect = reportpage;
			Morebits.wiki.actionCompleted.notice = 'Pelaporan selesai';

			var spiPage = new Morebits.wiki.Page(reportpage, 'Memperoleh halaman diskusi');
			spiPage.setFollowRedirect(true);
			spiPage.setEditSummary('Menambahkan laporan baru untuk [[Istimewa:Kontribusi/' + reportData.sockmaster + '|' + reportData.sockmaster + ']].');
			spiPage.setChangeTags(Twinkle.changeTags);
			spiPage.setAppendText(reportData.wikitext);
			spiPage.setWatchlist(Twinkle.getPref('spiWatchReport'));
			spiPage.append();

			Morebits.wiki.removeCheckpoint(); // all page updates have been started
			break;

		case 'an3':
			// prepare the AN3 report, then post and notify
			Twinkle.arv.callback.getAn3ReportData(input).then((data) => {
				// If there are any reasons why the user might want to cancel the report, check with them about each reason and cancel if they choose to
				for (const confirmation of data.confirmations) {
					if (!confirm(confirmation)) {
						return;
					}
				}

				Morebits.SimpleWindow.setButtonsEnabled(false);
				Morebits.Status.init(form);

				Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

				const reportpage = 'Wikipedia:Administrators\' noticeboard/Edit warring';

				Morebits.wiki.actionCompleted.redirect = reportpage;
				Morebits.wiki.actionCompleted.notice = 'Laporan selesai';

				const an3Page = new Morebits.wiki.Page(reportpage, 'Mendapatkan halaman diskusi');
				an3Page.setFollowRedirect(true);
				an3Page.setEditSummary('Menambahkan laporan baru untuk [[Istimewa:Kontribusi/' + data.uid + '|' + data.uid + ']].');
				an3Page.setChangeTags(Twinkle.changeTags);
				an3Page.setAppendText(data.reportWikitext);
				an3Page.append();

				// notify user

				const notifyText = '\n\n{{subst:an3-notice|1=' + mw.util.wikiUrlencode(data.uid) + '|auto=1}} ~~~~';

				const talkPage = new Morebits.wiki.Page('Pembicaraan pengguna:' + data.uid, 'Memberitahu pengguna');
				talkPage.setFollowRedirect(true);
				talkPage.setEditSummary('Memberitahu mengenai diskusi perang suntingan.');
				talkPage.setChangeTags(Twinkle.changeTags);
				talkPage.setAppendText(notifyText);
				talkPage.append();
				Morebits.wiki.removeCheckpoint(); // all page updates have been started
			}).catch((error) => {
				console.error('Galat terjadi saat mempersiapkan laporan AN3.', error); // eslint-disable-line no-console
				alert('Galat terjadi saat mempersiapkan laporan AN3: ' + error.message);
			});
			break;
	}
};

Twinkle.arv.callback.getAivReasonWikitext = function(input) {
	let type = input.arvtype || []; // memastikan ini adalah array
	let reason = input.reason || '';

	if (type.length === 0 && reason.trim() === '') {
		return null; // Kalau tidak ada yang dipilih atau ditulis, mengembalikan null
	}

	let text = '';

	if (input.page) {
		text += 'Di {{No redirect|' + input.page + '}}';
		if (input.badid) {
			text += ' ({{diff|' + input.page + '|' + input.badid + '|' + (input.goodid || '') + '|diff}})';
		}
		text += ': ';
	}

	const type_text = type.map(v => {
		switch (v) {
			case 'final': return 'vandalisme setelah peringatan terakhir';
			case 'postblock': return 'vandalisme setelah pemblokiran baru-baru ini';
			case 'vandalonly': return 'tindakan mengindikasikan akun vandal semata';
			case 'promoonly': return 'akun hanya digunakan untuk tujuan promosi';
			case 'spambot': return 'akun terbukti sebuah bot spam atau akun terkompromi';
			default: return '';
		}
	}).filter(Boolean).join('; '); // untuk menghapus string kosong

	if (type_text) {
		text += type_text;
	}

	if (reason.trim()) {
		if (text) {
			text += '. '; // Kalau ada teks, tambahkan titik dibelakangnya
		}
		text += reason.trim();
	}

	if (!text) {
		return null; // Hanya jaga-jaga saja
	}

	if (!/[.?!]$/.test(text)) {
		text += '.';
	}


	text = text.replace(/\r?\n/g, '\n*:'); // indent newlines
	return text;
};

Twinkle.arv.callback.buildAivReport = function(input) {
	return '\n*{{Vandal-m|' + (/=/.test(input.uid) ? '1=' : '') + input.uid + '}} &ndash; ' + Twinkle.arv.callback.getAivReasonWikitext(input) + ' ~~~~';
};

Twinkle.arv.callback.getUsernameReportWikitext = function(input) {
	// generate human-readable string, e.g. "misleading and promotional username"
	if (input.arvtype.length <= 2) {
		input.arvtype = input.arvtype.join(' dan ');
	} else {
		input.arvtype = [ input.arvtype.slice(0, -1).join(', '), input.arvtype.slice(-1) ].join(' dan ');
	}

	let text = '*{{user-uaa|1=' + input.uid + '}} &ndash; ';
	if (input.arvtype.length) {
		text += 'Pelanggaran kebijakan nama pengguna karena nama pengguna yang ' + input.arvtype + '. ';
	}
	if (input.reason !== '') {
		text += Morebits.string.toUpperCaseFirstChar(input.reason);
		const endsInPeriod = /\.$/.test(input.reason);
		if (!endsInPeriod) {
			text += '.';
		}
		text += ' ';
	}
	text += '~~~~';
	text = text.replace(/\r?\n/g, '\n*:'); // indent newlines

	return text;
};

Twinkle.arv.callback.getSpiReportData = function(input) {
	const isPuppetReport = input.category === 'puppet';

	if (!isPuppetReport) {
		input.sockpuppets = input.sockpuppets.filter((sock) => sock.trim() !== ''); // ignore empty sockpuppet inputs
	}

	if (isPuppetReport && !input.sockmaster) {
		return { error: 'Anda belum memasukan induk akun kedua. Tolong laporkan akun ini sebagai akun kedua saja.' };
	} else if (!isPuppetReport && input.sockpuppets.length === 0) {
		return { error: 'Anda belum memasukan akun kedua untuk induk ini. Tolong laporkan akun ini sebagai akun kedua saja.' };
	}

	input.sockmaster = input.sockmaster || input.uid;
	const allSocks = [input.sockmaster].concat(isPuppetReport ? [input.uid] : Morebits.array.uniq(input.sockpuppets));
	let socksString = '';
	allSocks.forEach((sock) => {
		socksString += '|' + sock;
	});

	let evidence = input.evidence.trim();
	if (!evidence) {
        evidence = '(Tidak ada bukti yang diberikan)';
    }
	if (input.checkuser) {
        evidence += '\n\n; Permintaan pemeriksaan';
    }
	const reportTemplate =
		"{{safesubst:#ifexist:{{safesubst:FULLPAGENAME}}\n" +
		"|=== {{safesubst:#time:d F Y}} ===\n" +
		"|__TOC__\n" +
		"{{SPIarchive notice|$controller}}\n" +
		"{{SPIpriorcases}}\n" +
		"=== {{safesubst:#time:d F Y}} ===\n" +
		"}}\n" +
		"{{SPI case status|baru}}\n" +
		"==== Terduga pengguna siluman ====\n" +
		"{{MultiCU$socks}}\n" +
		"$evidence ~~~~\n" +
		"==== Komentar pengguna lain ====\n" +
		"<small>''Pihak tertuduh juga dapat berkomentar/berdiskusi pada bagian ini.''</small>\n" +
		"==== Komentar pemeriksa, pengurus, dan/atau petugas ====\n" +
		"----<!--- Semua komentar harus ditulis DI ATAS baris ini. -->";

	// Substitusi variabel
	let wikitext = reportTemplate
		.replace(/\$controller/g, input.sockmaster)
		.replace(/\$socks/g, socksString)
		.replace(/\$evidence/g, evidence);

	return {
		sockmaster: input.sockmaster,
		wikitext: wikitext
	};
};

Twinkle.arv.callback.getAn3ReportData = async function(input) {
	const confirmations = [];

	const diffs = input.s_diffs ? input.s_diffs.map(JSON.parse) : [];

	if (diffs.length < 3) {
		confirmations.push('Anda memilih kurang dari tiga suntingan mengganggu. Apakah Anda ingin tetap membuat laporan?');
	}

	const warnings = input.s_warnings ? input.s_warnings.map(JSON.parse) : [];

	if (!warnings.length) {
		confirmations.push('Anda belum memilih suntingan peringatan kepada pelanggar. Apakah Anda ingin tetap membuat laporan?');
	}

	const resolves = input.s_resolves ? input.s_resolves.map(JSON.parse) : [];
	const freeResolves = input.s_resolves_free;
	let freeResolvesData;
	if (freeResolves) {
		let query;
		let diff, oldid;
		const specialDiff = /Istimewa:Diff\/(\d+)(?:\/(\S+))?/i.exec(freeResolves);
		if (specialDiff) {
			if (specialDiff[2]) {
				oldid = specialDiff[1];
				diff = specialDiff[2];
			} else {
				diff = specialDiff[1];
			}
		} else {
			diff = mw.util.getParamValue('diff', freeResolves);
			oldid = mw.util.getParamValue('oldid', freeResolves);
		}
		const title = mw.util.getParamValue('title', freeResolves);
		const diffNum = /^\d+$/.test(diff); // used repeatedly

		// rvdiffto in prop=revisions is deprecated, but action=compare doesn't return
		// timestamps ([[phab:T247686]]) so we can't rely on it unless necessary.
		// Likewise, we can't rely on a meaningful comment for diff=cur.
		// Additionally, links like Special:Diff/123/next, Special:Diff/123/456, or ?diff=next&oldid=123
		// would each require making use of rvdir=newer in the revisions API.
		// That requires a title parameter, so we have to use compare instead of revisions.
		if (oldid && (diff === 'cur' || (!title && (diff === 'next' || diffNum)))) {
			query = {
				action: 'compare',
				fromrev: oldid,
				prop: 'ids|title',
				format: 'json'
			};
			if (diffNum) {
				query.torev = diff;
			} else {
				query.torelative = diff;
			}
		} else {
			query = {
				action: 'query',
				prop: 'revisions',
				rvprop: 'ids|timestamp|comment',
				format: 'json',
				indexpageids: true
			};

			if (diff && oldid) {
				if (diff === 'prev') {
					query.revids = oldid;
				} else {
					query.titles = title;
					query.rvdir = 'newer';
					query.rvstartid = oldid;

					if (diff === 'next' && title) {
						query.rvlimit = 2;
					} else if (diffNum) {
						// Diffs may or may not be consecutive, no limit
						query.rvendid = diff;
					}
				}
			} else {
				// diff=next|prev|cur with no oldid
				// Implies title= exists otherwise it's not a valid diff link (well, it is, but to the Main Page)
				if (diff && /^\D+$/.test(diff)) {
					query.titles = title;
				} else {
					query.revids = diff || oldid;
				}
			}
		}

		let queryResponse;
		try {
			queryResponse = await new mw.Api().get(query);
		} catch (err) {
			const error = new Error('Pemanggilan API MediaWiki gagal.');
			error.cause = err;
			throw error;
		}

		if (queryResponse.compare && queryResponse.compare.fromtitle === queryResponse.compare.totitle) {
			freeResolvesData = queryResponse;
		} else if (queryResponse.query) {
			const pageIds = queryResponse.query.pageids;
			if (!Array.isArray(pageIds) || pageIds.length !== 1) {
				const error = new Error('Gagal mengurai diff.');
				error.cause = queryResponse;
				throw error;
			}
			freeResolvesData = queryResponse.query.pages[pageIds[0]];
		} else {
			const error = new Error('Tidak dapat menemukan diff terkait dengan URL yang disediakan.');
			error.cause = queryResponse;
			throw error;
		}
	} else {
		freeResolvesData = undefined;
	}

	if (!resolves.length && !freeResolvesData) {
		confirmations.push('Anda belum memilih suntingan manapun yang menunjukkan Anda ingin menyelesaikan masalah. Apakah Anda ingin tetap membuat laporan?');
	}

	const data = {
		uid: input.uid,
		page: input.page,
		comment: input.comment,
		diffs: diffs,
		warnings: warnings,
		resolves: resolves,
		free_resolves: freeResolvesData,
		confirmations: confirmations
	};
	let minid;
	for (let i = 0; i < data.diffs.length; ++i) {
		if (data.diffs[i].parentid && (!minid || data.diffs[i].parentid < minid)) {
			minid = data.diffs[i].parentid;
		}
	}

	let queryResponse;
	try {
		queryResponse = await new mw.Api().get({
			action: 'query',
			prop: 'revisions',
			format: 'json',
			rvprop: 'sha1|ids|timestamp|comment',
			rvlimit: 100, // intentionally limited
			rvstartid: minid,
			rvexcludeuser: data.uid,
			indexpageids: true,
			titles: data.page
		});
	} catch (err) {
		const error = new Error('Pemanggilan API MediaWiki gagal.');
		error.cause = err;
		throw error;
	}

		// In case an edit summary was revdel'd
	const hasHiddenComment = function(rev) {
		if (!rev.comment && typeof rev.commenthidden === 'string') {
			return '(Komentar tersembunyi)';
		}
		// swap curly braces for HTML entities to avoid templates being rendered if they were included in an edit summary
		return '"' + rev.comment.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;') + '"';
	};

	let orig;
	if (queryResponse.length) {
		const sha1 = queryResponse[0].sha1;
		for (let i = 1; i < queryResponse.length; ++i) {
			if (queryResponse[i].sha1 === sha1) {
				orig = queryResponse[i];
				break;
			}
		}
		if (!orig) {
			orig = queryResponse[0];
		}
	}
	let origtext = '';
	if (orig) {
		origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} ' + hasHiddenComment(orig);
	}
		const groupedDiffs = {};

		let parentid, lastid;
	for (let j = 0; j < data.diffs.length; ++j) {
		const cur = data.diffs[j];
		if ((cur.revid && cur.revid !== parentid) || lastid === null) {
			lastid = cur.revid;
			groupedDiffs[lastid] = [];
		}
		parentid = cur.parentid;
		groupedDiffs[lastid].push(cur);
	}

		const difftext = $.map(groupedDiffs, (sub) => {
		let ret = '';
		if (sub.length >= 2) {
			const last = sub[0];
			const first = sub.slice(-1)[0];
			const label = 'Suntingan berturut-turut dari ' + new Morebits.Date(first.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) hingga ' + new Morebits.Date(last.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)';
			ret = '# {{diff|oldid=' + first.parentid + '|diff=' + last.revid + '|label=' + label + '}}\n';
		}
		ret += sub.reverse().map((v) => (sub.length >= 2 ? '#' : '') + '# {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');
			return ret;
		}).reverse().join('\n');
		const warningtext = data.warnings.reverse().map((v) => '#  {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');

		let resolvetext = data.resolves.reverse().map((v) => '#  {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');

		if (data.free_resolves) {
		const page = data.free_resolves;
		if (page.compare) {
			resolvetext += '\n# {{diff|oldid=' + page.compare.fromrevid + '|diff=' + page.compare.torevid + '|label=Suntingan berturut-turut pada ' + page.compare.totitle + '}}';
		} else if (page.revisions) {
			const revCount = page.revisions.length;
			let rev;
			if (revCount < 3) { // diff=prev or next
				rev = revCount === 1 ? page.revisions[0] : page.revisions[1];
				resolvetext += '\n# {{diff2|' + rev.revid + '|' + new Morebits.Date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) pada ' + page.title + '}} ' + hasHiddenComment(rev);
			} else { // diff and oldid are nonconsecutive
				rev = page.revisions[0];
				const revLatest = page.revisions[revCount - 1];
				const label = 'Suntingan berturut-turut dari ' + new Morebits.Date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) hingga ' + new Morebits.Date(revLatest.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) pada ' + page.title;
				resolvetext += '\n# {{diff|oldid=' + rev.revid + '|diff=' + revLatest.revid + '|label=' + label + '}}\n';
			}
		}
	}
	let comment = data.comment.replace(/~*$/g, '').trim();
	if (comment) {
		comment += ' ~~~~';
	}
	const reportWikitext = '\n\n{{subst:AN3 report|diffs=' + difftext + '|warnings=' + warningtext + '|resolves=' + resolvetext + '|pagename=' + data.page + '|orig=' + origtext + '|comment=' + comment + '|uid=' + data.uid + '}}';

	return {
		uid: data.uid,
		reportWikitext: reportWikitext,
		confirmations: data.confirmations
	};
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
}());

// </nowiki>
