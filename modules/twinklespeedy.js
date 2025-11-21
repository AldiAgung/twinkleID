// <nowiki>

(function() {

/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'KPC', 'tw-csd', Morebits.userIsSysop ? 'Hapus halaman menurut WP:KPC' : 'Meminta penghapusan cepat menurut WP:KPC');
};

Twinkle.speedy.data = [
	{
		list: 'customRationale',
		label: 'Penghapusan khusus' + (Morebits.userIsSysop ? ' (alasan penghapusan lainnya)' : ' gunakan templat {{db}}'),
		code: 'db',
		db: 'reason',
		tooltip: '{{db}} kependekan dari "dihapus karena". Sekurang-kurangnya satu kriteria harus diberikan, dan sebutkan alasannya.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Kriteria:',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		list: 'talkList',
		label: 'U8: Halaman pembicaraan yatim',
		code: 'u8',
		db: 'talk',
		tooltip: 'Halaman seperti pembicaraan pengguna, arsipnya, dan pembicaraan berkas dari Commons tidak dianggap berguna untuk proyek.'
	},
	{
		list: 'fileList',
		label: 'B1: Redundan atau duplikat',
		code: 'b1',
		db: 'redundantimage',
		tooltip: 'Berkas atau media yang tidak terpakai dan merupakan salinan dari berkas lain di Wikipedia, dengan format dan kualitas yang sama atau lebih rendah, dianggap duplikat. Namun, duplikat berkas dari Wikimedia Commons tidak termasuk, karena ada pertimbangan lisensi.',
		subgroup: {
			name: 'redundantimage_filename',
			type: 'input',
			label: 'Berkas ini redundan ke:',
			tooltip: 'Prefix "Berkas:" dapat dibiarkan.'
		}
	},
	{
		list: 'fileList',
		label: 'B2: Rusak atau kosong',
		code: 'b2',
		db: 'noimage',
		tooltip: 'Sebelum menghapus berkas seperti ini, pastikan MediaWiki tidak dapat menampilkan pratayang gambar dalam ukuran kecil. Jika masih bisa dipratinjau, berkas sebaiknya tidak dihapus. Pemuat asli dapat memperbaiki masalah dengan mengunggah ulang versi berkas yang tidak rusak.'
	},
	{
		list: 'fileList',
		label: 'B2: Halaman deskripsi berkas yang tidak dibutuhkan untuk berkas yang berada di Commons',
		code: 'b2',
		db: 'fpcfail',
		tooltip: 'Gambar dari Wikimedia Commons yang tidak lagi diperlukan, dan tidak memiliki tag atau informasi pada halaman deskripsi di Wikipedia bahasa Indonesia, sebaiknya dihapus.',
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'B3: Lisensi yang tidak sesuai',
		code: 'b3',
		db: 'noncom',
		tooltip: 'Berkas dengan lisensi terbatas seperti nonkomersial, tanpa karya turunan, atau izin khusus dapat dihapus jika tidak memenuhi standar konten tak bebas; berkas berlisensi GFDL sebelum versi 1.3 yang melarang versi setelahnya juga dapat dihapus.'
	},
	{
		list: 'fileList',
		label: 'B4: Informasi lisensi kurang',
		code: 'b4',
		db: 'unksource',
		tooltip: 'Berkas tanpa informasi lisensi yang cukup dapat dihapus setelah tujuh hari, kecuali jika informasinya ditambahkan; sumber kadang disebut di ringkasan pemuatan.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'B5: Berkas tak bebas yang tak digunakan',
		code: 'b5',
		db: 'b5',
		tooltip: 'Berkas tak bebas atau bukan domain publik yang tidak digunakan di artikel manapun dapat dihapus setelah tujuh hari, kecuali jika akan dipakai untuk artikel yang sedang disiapkan.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'B6: Tidak memiliki alasan penggunaan tak bebas',
		code: 'b6',
		db: 'norat',
		tooltip: 'Berkas tak bebas yang diberi tag "penggunaan wajar" tanpa alasan rasional dapat dihapus setelah tujuh hari; tag {{Fair use}} saja tidak cukup, kecuali jika alasan sudah diberikan meski masih diperdebatkan.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'B7: Klaim penggunaan wajar tidak sah',
		code: 'b7',
		db: 'badfairuse',
		tooltip: 'Berkas tak bebas dengan templat penggunaan wajar yang jelas tidak sah, seperti tag {{Logo}} pada foto maskot, dapat dihapus segera tanpa menunggu.',
		subgroup: {
			name: 'badfairuse_rationale',
			type: 'input',
			label: 'Penjelasan (opsional):',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'B8: Berkas yang sama persis tersedia di Wikimedia Commons',
		code: 'b8',
		db: 'commons',
		tooltip: 'Berkas lokal dapat dihapus jika versi di Commons memiliki format dan kualitas setara atau lebih tinggi, lisensinya sah dan sesuai standar Commons, semua informasi sudah tercantum di Commons, nama berkas sudah disesuaikan di semua penggunaan lokal, dan berkas tidak dilindungi, karena berkas yang dilindungi tidak boleh dihapus meskipun ada duplikatnya di Commons.',
		subgroup: {
			name: 'commons_filename',
			type: 'input',
			label: 'Nama berkas di Commons:',
			value: Morebits.pageNameNorm,
			tooltip: 'Kosongkan kolom jika nama berkasnya sama; awalan "Berkas:" boleh digunakan atau diabaikan.'
		},
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'B9: Terang-terangan melanggar hak cipta',
		code: 'b9',
		db: 'imgcopyvio',
		tooltip: 'Berkas yang diklaim berlisensi bebas padahal tidak, dan tanpa URL atau sumber yang jelas, dapat dihapus; kecuali jika klaimnya dapat dipercaya atau berasal dari pemilik sah yang melepasnya di bawah lisensi bebas yang sesuai, termasuk dari situs stok foto seperti Getty Images dan Corbis.',
		subgroup: [
			{
				name: 'imgcopyvio_url',
				type: 'input',
				label: 'Cantumkan URL sumber yang lengkap, termasuk "http://"; jika tidak tersedia, jangan gunakan KPC B9.',
				size: 60
			},
			{
				name: 'imgcopyvio_rationale',
				type: 'input',
				label: 'Berkas melanggar hak cipta dan tidak berasal dari sumber daring; tidak ada bukti lisensi atau izin yang sah.',
				size: 60
			}
		]
	},
	{
		list: 'fileList',
		label: 'B11: Tak ada bukti izin penggunaan',
		code: 'b11',
		db: 'nopermission',
		tooltip: 'Berkas dengan lisensi yang diklaim berasal dari pihak ketiga tanpa bukti persetujuan dapat dihapus tujuh hari setelah pemuat diberi tahu.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'U8: Halaman deksripsi berkas tanpa adanya berkas',
		code: 'u8',
		db: 'imagepage',
		tooltip: 'Gunakan ini hanya jika berkas benar-benar tidak ada; untuk berkas rusak gunakan B2, pengalihan tidak sesuai gunakan R3, dan pengalihan rusak ke Commons gunakan U6.'
	},
	{
		list: 'articleList',
		label: 'A1: Artikel tanpa konteks.',
		code: 'a1',
		db: 'nocontext',
		tooltip: 'Artikel sangat pendek tanpa konteks yang cukup untuk berdiri sendiri atau dikembangkan lebih lanjut dapat dihapus; konteks berbeda dari isi.'
	},
	{
		list: 'articleList',
		label: 'A2: Artikel berbahasa asing yang tidak diterjemahkan atau diterjemahkan secara buruk',
		code: 'a2',
		db: 'foreign',
		tooltip: 'Artikel dari proyek Wikimedia lain yang belum diterjemahkan atau diterjemahkan buruk dapat dihapus, kecuali jika sudah mencapai standar rintisan. Dalam hal ini, cukup hapus bagian yang belum diterjemahkan; artikel nonterjemahan cukup diberi tag {{terjemah}}.',
		subgroup: {
			name: 'foreign_source',
			type: 'input',
			label: 'Gunakan pranala interwiki untuk menghubungkan ke artikel di wiki bahasa asing yang relevan.',
			tooltip: 'Misalnya, en:Indonesia'
		}
	},
	{
		list: 'articleList',
		label: 'A3: Tanpa isi',
		code: 'a3',
		db: 'nocontent',
		tooltip: 'Artikel (bukan disambiguasi, pengalihan, atau pengalihan lunak) yang hanya berisi elemen non-isi seperti pranala luar, kategori, templat non-infobox, gambar, bagian "lihat pula", judul parafrase, ajakan kontak, atau komentar diskusi dapat dihapus, kecuali jika mengandung isi meskipun pendek atau memiliki infobox dengan informasi nontrivia.'
	},
	{
		list: 'articleList',
		label: 'A7: Tidak mengindikasikan kepentingan (tokoh, organisasi, isi situs)',
		code: 'a7',
		db: 'a7',
		tooltip: 'Artikel tentang tokoh, organisasi (kecuali sekolah), atau isi situs yang tidak menunjukkan kepentingan subyek dapat dihapus; jika kontroversial, gunakan templat {{hapus}} atau ajukan ke Wikipedia:Usulan penghapusan.',
		// hideWhenSingle: true // <- dikarenakan di Wiki EN harus digabung, maka harus di komen atau lebih baik dihapus saja untuk memunculkan tombol ini
	},
	{
		list: 'articleList',
		label: 'A9: Artikel yang tidak mengindikasikan kepentingan (rekaman musik)',
		code: 'a9',
		db: 'a9',
		tooltip: 'Artikel tentang rekaman musik yang tidak menunjukkan kepentingan subjek dan/atau artisnya belum ada di Wikipedia bahasa Indonesia dapat dihapus.'
	},
	{
		list: 'articleList',
		label: 'A10: Artikel yang tidak dirapikan dalam batas waktu yang telah ditentukan',
		code: 'a10',
		db: 'a10',
		tooltip: 'Artikel yang tidak dirapikan dalam batas waktu yang ditentukan dan menurunkan kualitas Wikipedia dapat dihapus.',
		subgroup: {
			name: 'a10_article',
			type: 'input',
			label: 'Artikel serupa:'
		}
	},
	{
		list: 'articleList',
		label: 'A11: Tidak ada kepentingan klaim',
		code: 'a11',
		db: 'deleted-multiple',
		tooltip: 'Artikel yang menyatakan topiknya dibuat atau ditemukan oleh pembuatnya atau kenalan pribadi, tanpa penjelasan yang meyakinkan tentang kepentingannya, dapat dihapus.'
	},
	{
		list: 'categoryList',
		label: 'K1: Kategori tanpa isi',
		code: 'c1',
		db: 'catempty',
		tooltip: 'Kategori tanpa isi selama minimal empat hari dapat dihapus, kecuali jika termasuk kategori disambiguasi, pengalihan, topik pilihan, duplikat, atau kategori yang wajar kosong sewaktu-waktu (seperti yang ditransklusikan oleh kotak pengguna); gunakan {{kategori kosong}} untuk mencegah penghapusan.'
	},
	{
		list: 'categoryList',
		label: 'K4: Kategori pemeliharaan tak terpakai',
		code: 'c4',
		db: 'c4',
		tooltip: 'Kategori pemeliharaan yang tidak digunakan dan dipastikan akan selalu kosong, seperti kategori bertanggal masa lalu, kategori pelacakan usang, atau subkategori kosong dari kategori akun ganda/siluman, dapat dihapus; kategori yang hanya sedang kosong tidak termasuk.',
		subgroup: {
			name: 'c4_rationale',
			type: 'input',
			label: 'Penjelasan opsional:',
			size: 60
		}
	},
	{
		list: 'templateList',
		label: 'T5: Templat subhalaman tidak terpakai',
		code: 't5',
		db: 't5',
		tooltip: 'Modul Lua dan subhalaman templat yang tidak digunakan dapat dihapus, kecuali jika berupa /testcases, /sandbox, atau subhalaman dari Modul:Kotak Pasir.'
	},
	{
		list: 'userList',
		label: 'H1: Permintaan pengguna',
		code: 'h1',
		db: 'userreq',
		tooltip: 'Halaman dapat dihapus atas permintaan pembuatnya jika belum disunting secara berarti oleh pengguna lain; pengosongan halaman oleh pembuatnya dapat dianggap sebagai permintaan penghapusan.',
		subgroup: mw.config.get('wgNamespaceNumber') === 3 && !mw.config.get('wgTitle').includes('/') ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'Alasan penghapusan (wajib):',
			tooltip: 'Halaman pembicaraan pengguna hanya dihapus dalam keadaan yang sangat jarang dan luar biasa.',
			size: 60
		} : null,
		hideSubgroupWhenMultiple: true
	},
	{
		list: 'userList',
		code: 'H2',
		label: 'H2: Pengguna tidak nyata',
		db: 'nouser',
		tooltip: 'Halaman pengguna dari akun yang tidak nyata (menurut Istimewa:Daftar pengguna) dapat dihapus.'
	},
	{
		list: 'userList',
		label: 'H5: Nonkontributor menyalahgunaan Wikipedia sebagai hos web pribadi',
		code: 'h5',
		db: 'notwebhost',
		tooltip: 'Halaman di ruang pengguna yang isinya tidak berkaitan erat dengan tujuan Wikipedia dan pemiliknya jarang atau tidak menyunting di luar halaman pengguna dapat dihapus, kecuali jika berupa draf yang masuk akal atau mematuhi WP:UPYES; ketentuan ini berlaku tanpa memandang usia halaman.',
		hideWhenRedirect: true
	},
	{
		list: 'userList',
		label: 'U11: Halaman pengguna untuk promosi, dengan nama pengguna untuk tujuan promosi',
		code: 'u11',
		db: 'spamuser',
		tooltip: 'Halaman pengguna yang bersifat promosi dan menggunakan nama pengguna untuk tujuan promosi dapat dihapus. Jika hanya halamannya yang bersifat spam sementara nama pengguna tidak, cukup tandai dengan U11.',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	// {
	// 	list: 'userList',
	// 	label: 'U13: Permintaan draft AfC atau draft kosong, dibiakan lebih dari 6 bulan',
	// 	code: 'u13',
	// 	db: 'afc',
	// 	tooltip: 'Permintaan draft AfC yang ditolak atau tidak dikirimkan atau draft kosong, yang tidak disunting lebih dari 6 bulan (tidak termasuk suntingan bot).',
	// 	hideWhenMultiple: true,
	// 	hideWhenRedirect: true
	// },
	{
		list: 'generalList',
		label: 'U1: Tulisan ngawur. Yang termasuk di dalamnya: Halaman-halaman yang isinya hanyalah ujaran tak keruan, tanpa makna dan isi.',
		code: 'u1',
		db: 'nonsense',
		tooltip: 'Yang tidak termasuk: penulisan buruk, terjemahan buruk, vandalisme, materi fiktif, konten non-Indonesia, atau berita palsu; meskipun beberapa dapat dihapus jika tergolong vandalisme.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		list: 'generalList',
		label: 'U2: Uji coba',
		code: 'u2',
		db: 'test',
		tooltip: 'Halaman yang dibuat hanya untuk mencoba kode wiki dapat dihapus, kecuali jika berada di halaman Bak pasir atau ruang nama Pengguna.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		list: 'generalList',
		label: 'U3: Vandalisme murni/terang-terangan',
		code: 'u3',
		db: 'vandalism',
		tooltip: 'Vandalisme murni atau terang-terangan, termasuk pengalihan yang ditinggalkan akibat vandalisme pemindahan halaman, dapat dihapus.'
	},
	{
		list: 'generalList',
		label: 'U3: Materi palsu terang-terangan',
		code: 'u3',
		db: 'hoax',
		tooltip: 'Materi palsu yang jelas dibuat untuk tujuan vandalisme dapat dihapus tanpa perlu diskusi lebih lanjut.',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U4: Pembuatan ulang dari halaman yang sudah dihapus',
		code: 'u4',
		db: 'repost',
		tooltip: 'Salinan dari halaman yang sebelumnya dihapus melalui diskusi (seperti Usulan penghapusan atau pembicaraan) dapat dihapus kembali; pengecualian berlaku untuk pemulihan melalui evaluasi penghapusan atau halaman yang dihapus tanpa diskusi.',
		subgroup: {
			name: 'repost_xfd',
			type: 'input',
			label: 'Halaman yang memuat diskusi penghapusan:',
			tooltip: 'Harus dimulai dengan awalan "Wikipedia:"',
			size: 60
		}
	},
	{
		list: 'generalList',
		label: 'U5: Pengguna yang diblokir atau yang dilarang',
		code: 'u5',
		db: 'banned',
		tooltip: 'Halaman yang dibuat oleh pengguna yang sedang diblokir atau dilarang, termasuk akun siluman yang melanggar ketentuan pemblokiran atau peringatan, dapat dihapus.',
		subgroup: {
			name: 'banned_user',
			type: 'input',
			label: 'Nama pengguna yang diblokir (jika ada):',
			tooltip: 'Jangan dimulai dengan "Pengguna:"'
		}
	},
	{
		list: 'generalList',
		label: 'U6: Galat',
		code: 'u6',
		db: 'error',
		tooltip: 'Halaman yang dibuat karena kesalahan, atau pengalihan yang tersisa dari pemindahan dengan judul yang keliru, dapat dihapus.',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U6: Pemindahan',
		code: 'u6',
		db: 'move',
		tooltip: 'Halaman yang hanya dibuat untuk memberi tempat bagi pemindahan (misalnya sebagai target pengalihan sementara) dapat dihapus setelah tidak lagi diperlukan.',
		subgroup: [
			{
				name: 'move_page',
				type: 'input',
				label: 'Halaman yang akan dipindahkan ke sini:'
			},
			{
				name: 'move_reason',
				type: 'input',
				label: 'Alasan:',
				size: 60
			}
		],
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U6: Proses penghapusan (UP-X)',
		code: 'u6',
		db: 'xfd',
		tooltip: 'Halaman yang tetap ada meskipun diskusi penghapusan (UP, UP-B, RfD, TfD, CfD, atau MfD) ditutup dengan keputusan "hapus" dapat dihapus sesuai hasil diskusi.',
		subgroup: {
			name: 'xfd_fullvotepage',
			type: 'input',
			label: 'Halaman tempat diskusi penghapusan dilakukan:',
			tooltip: 'Dimulai dengan awalan "Wikipedia:"',
			size: 40
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U6: Pemindahan AfC',
		code: 'u6',
		db: 'afc-move',
		tooltip: 'Draf yang layak dapat dipindahkan ke PPH.',
		subgroup: {
			name: 'draft_page',
			type: 'input',
			label: 'Draf yang akan dipindahkan kesini:'
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U6: Pemindahan salin-tempel',
		code: 'u6',
		db: 'copypaste',
		tooltip: 'Halaman hasil salin-tempel yang perlu dihapus sementara untuk memberi tempat bagi pemindahan melalui peralatan Wikipedia.',
		subgroup: {
			name: 'copypaste_sourcepage',
			type: 'input',
			label: 'Halaman asal yang disalin-tempel:'
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U6: Alasan teknis',
		code: 'u6',
		db: 'u6',
		tooltip: 'Halaman yang perlu dihapus karena alasan teknis lainnya.',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: 'Alasan:',
			size: 60
		}
	},
		{
		list: 'generalList',
		label: 'U6: Halaman disambiguasi yang tak perlu',
		code: 'u6',
		db: 'disambig',
		tooltip: 'Halaman disambiguasi yatim yang hanya mengarah ke satu atau tidak ada halaman Wikipedia, terutama jika berjudul "(disambiguasi)", dapat dihapus.'
	},
	{
		list: 'generalList',
		label: 'U7: Permintaan pembuat halaman',
		code: 'u7',
		db: 'author',
		tooltip: 'Halaman dapat dihapus atas permintaan pembuatnya, jika belum disunting secara berarti oleh pengguna lain; pengosongan halaman oleh pembuatnya dapat dianggap sebagai permintaan penghapusan.',
		subgroup: {
			name: 'author_rationale',
			type: 'input',
			label: 'Penjelasan opsional:',
			tooltip: 'Halaman dapat dihapus jika pembuatnya secara eksplisit meminta penghapusan dan belum disunting secara berarti oleh pengguna lain.',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		list: 'generalList',
		label: 'U8: Halaman yang tergantung pada halaman yang tak ada atau yang dihapus',
		code: 'u8',
		db: 'u8',
		tooltip: 'Halaman-halaman yang tidak lagi memiliki fungsi, seperti pengalihan rusak, halaman pembicaraan dari artikel yang telah dihapus, subhalaman dari super-halaman yang telah dihapus, halaman berkas tanpa berkas, atau kategori kosong akibat pemindahan isi, dapat dihapus; pengecualian berlaku untuk diskusi penghapusan yang tidak terdokumentasi di tempat lain, halaman pengguna dan pembicaraannya, arsip pembicaraan, pengalihan rusak yang masih dapat diarahkan, serta halaman berkas dan pembicaraannya untuk berkas yang tersedia di Commons.',
		subgroup: {
			name: 'g8_rationale',
			type: 'input',
			label: 'Penjelasan opsional:',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		list: 'generalList',
		label: 'U8: Subhalaman dengan tidak ada halaman utama',
		code: 'u8',
		db: 'subpage',
		tooltip: 'Pengecualian berlaku untuk halaman yang masih berguna bagi proyek, termasuk: diskusi penghapusan yang tidak terdokumentasi di tempat lain, halaman pengguna dan pembicaraannya, arsip pembicaraan, pengalihan yang masih dapat diarahkan ke target yang valid, serta halaman berkas dan pembicaraannya untuk berkas yang tersedia di Wikimedia Commons.',
		hideWhenMultiple: true,
		hideInNamespaces: [ 0, 6, 8 ] // hide in main, file, and mediawiki-spaces
	},
	{
		list: 'generalList',
		label: 'U10: Halaman serangan',
		code: 'u10',
		db: 'attack',
		tooltip: 'Halaman yang berisi serangan atau olokan terhadap subjek atau entitas lain, termasuk ancaman dan artikel biografi bernada negatif tanpa sumber yang dapat diverifikasi, dapat dihapus; penilaian dapat didasarkan pada judul maupun isi artikel.'
	},
	{
		list: 'generalList',
		label: 'U10: Biografi orang hidup yang semuanya bernada negatif dan tanpa sumber',
		code: 'u10',
		db: 'negublp',
		tooltip: 'Artikel biografi orang hidup yang seluruh isinya bernada negatif tanpa sumber tepercaya, dan tidak memiliki versi netral dalam riwayat suntingan, dapat dihapus.',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'U11: Iklan atau promosi terang-terangan',
		code: 'u11',
		db: 'spam',
		tooltip: 'Halaman yang dibuat semata-mata untuk promosi dan tidak bersifat ensiklopedis dapat dihapus; namun, artikel dengan judul nama perusahaan atau produk tidak otomatis termasuk kategori ini.'
	},
	{
		list: 'generalList',
		label: 'U12: Pelanggaran hak cipta terang-terangan',
		code: 'u12',
		db: 'copyvio',
		tooltip: 'Halaman yang seluruh isinya melanggar hak cipta tanpa lisensi yang jelas, dan tidak memiliki versi bebas pelanggaran dalam riwayat suntingan, dapat dihapus seluruhnya.',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'URL (jika ada):',
				tooltip: 'Jika merupakan sumber daring, berikan di sini, dan tulis protokol "http://" atau "https://.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'URL tambahan:',
				tooltip: 'Opsional. Harus dimulai dengan "http://" atau "https://"',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'URL tambahan: ',
				tooltip: 'Opsional. Harus dimulai dengan "http://" atau "https://"',
				size: 60
			}
		]
	},
	{
		list: 'generalList',
		label: 'U13: Artikel dibuat secara murni dengan tulisan AI generatif',
		code: 'u13',
		db: 'u13',
		tooltip: 'Artikel yang sepenuhnya dibuat dengan alat AI tanpa menyertakan sumber atau referensi yang jelas dapat dihapus.',
	},
	/* <-- Belum ada kriteria yang sesuai di WBI, silahkan hilangkan komentar ini jika sudah ada -->
	{
		list: 'generalList',
		label: 'U15: Unreviewed LLM content',
		code: 'u15',
		db: 'llm',
		tooltip: 'This only applies to pages containing any of: (1) communication intended for the user (e.g., "Here is your Wikipedia article on..."); (2) implausible non-existent references; or (3) nonsensical citations, that would otherwise have been removed with human review.',
		subgroup: [
			{
				name: 'subcriteria',
				type: 'radio',
				list: [
					{
						label: 'Communication intended for the user',
						value: 'communication',
						tooltip: 'The page contains communication intended for the user, such as "Here is your Wikipedia article on...".'
					},
					{
						label: 'Implausible non-existent references',
						value: 'implausible',
						tooltip: 'The page contains implausible non-existent references.'
					},
					{
						label: 'Nonsensical citations',
						value: 'nonsensical',
						tooltip: 'The page contains nonsensical citations.'
					}
				]
			},
			{
				name: 'reason',
				type: 'input',
				label: 'Alasan tambahan (opsional):',
				tooltip: 'Spesifikan mengapa satu dari tiga kriteria ditambahkan ke halaman ini.',
				size: 60
			}
		]
	}, */
	{
		list: 'redirectList',
		label: 'R2: Pengalihan dari ruangnama artikel ke ruangnama lain, kecuali ruangnama Kategori:, Templat:, Wikipedia:, Bantuan:, dan Portal:',
		code: 'r2',
		db: 'rediruser',
		tooltip: 'Pengalihan yang muncul akibat pemindahan halaman sebaiknya tidak langsung dihapus; tunggu satu atau beberapa hari sebelum menghapusnya. Lihat pula: Wikipedia:Pengalihan antar-ruangnama.',
		showInNamespaces: [ 0 ]
	},
	{
		list: 'redirectList',
		label: 'R3: Pengalihan yang baru dibuat karena kesalahan ketik atau kesalahan penamaan yang tidak disengaja',
		code: 'r3',
		db: 'redirtypo',
		tooltip: 'Pengalihan dari kesalahan umum pengejaan, penamaan, atau istilah dalam bahasa lain biasanya berguna dan tidak seharusnya dihapus.'
	},
	{
		list: 'redirectList',
		label: 'R4: Pengalihan ruangnama berkas dengan nama yang sesuai dengan halaman Commons',
		code: 'r4',
		db: 'redircom',
		tooltip: 'Pengalihan sebaiknya tidak memiliki pranala masuk, kecuali jika pranala tersebut memang ditujukan untuk berkas atau pengalihan di Wikimedia Commons.',
		showInNamespaces: [ 6 ]
	},
	{
		list: 'redirectList',
		label: 'U6: Pengalihan ke halaman disambiguasi yang salah',
		code: 'u6',
		db: 'movedab',
		tooltip: 'Halaman disambiguasi yang berakhiran "(disambiguasi)" dapat dihapus jika tidak ada artikel utama yang sesuai dengan judul tanpa akhiran tersebut.',
		hideWhenMultiple: true
	},
	{
		list: 'redirectList',
		label: 'U8: Pengalihan ke target tidak sah',
		code: 'u8',
		db: 'redirnone',
		tooltip: 'Pengecualian berlaku untuk halaman yang masih berguna bagi proyek, termasuk: diskusi penghapusan yang tidak dicatat di tempat lain, halaman pengguna dan pembicaraannya, arsip pembicaraan, pengalihan yang dapat diperbaiki, serta halaman berkas dan pembicaraannya untuk berkas yang tersedia di Wikimedia Commons.',
		hideWhenMultiple: true
	},
	{
		list: 'redirectList',
		label: 'X3: Pengalihan tanpa spasi sebelum tanda kurung disambiguasi',
		code: 'x3',
		db: 'x3',
		tooltip: 'Pengecualian berlaku untuk istilah yang masih masuk akal dicari tanpa spasi, atau jika pengalihan memiliki riwayat suntingan yang signifikan (misalnya hasil penggabungan halaman).'
	}
];

/**
 * Given a list name such as talkList, fileList, redirectList, etc, return the CSDs that should be in that list.
 */
Twinkle.speedy.getCsdList = ( csdList ) => {
	const list = [];
	for (const item of Twinkle.speedy.data) {
		if (item.list === csdList) {
			const copy = Object.assign({}, item);
			// Change some things to match the old spec, from before I refactored this.
			delete copy.list;
			delete copy.code;
			copy.value = copy.db;
			delete copy.db;
			list.push(copy);
		}
	}
	return list;
};

Twinkle.speedy.customRationale = Twinkle.speedy.getCsdList( 'customRationale' );
Twinkle.speedy.talkList = Twinkle.speedy.getCsdList( 'talkList' );
Twinkle.speedy.fileList = Twinkle.speedy.getCsdList( 'fileList' );
Twinkle.speedy.articleList = Twinkle.speedy.getCsdList( 'articleList' );
Twinkle.speedy.categoryList = Twinkle.speedy.getCsdList( 'categoryList' );
Twinkle.speedy.templateList = Twinkle.speedy.getCsdList( 'templateList' );
Twinkle.speedy.userList = Twinkle.speedy.getCsdList( 'userList' );
Twinkle.speedy.generalList = Twinkle.speedy.getCsdList( 'generalList' );
Twinkle.speedy.redirectList = Twinkle.speedy.getCsdList( 'redirectList' );

/**
 * Iterate over Twinkle.speedy.data. Turn `code: 'u8', db: 'redirnone',` into `redirnone: 'u8',`
 */
Twinkle.speedy.getNormalizeHash = () => {
	const hash = {};
	for (const item of Twinkle.speedy.data) {
		if (item.code && item.db) {
			hash[item.db] = item.code;
		}
	}
	return hash;
};

/**
 * This is a map of Db-word templates to CSD codes such as a1. For example, `"nocontext": "a1"`
 */
Twinkle.speedy.normalizeHash = Twinkle.speedy.getNormalizeHash();

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	Twinkle.speedy.dialog = new Morebits.SimpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	const dialog = Twinkle.speedy.dialog;
	dialog.setTitle('Tolong pilih kriteria penghapusan cepat');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Kebijakan penghapusan cepat', 'WP:KPC');
	dialog.addFooterLink('Preferensi KPC', 'WP:TW/PREF#speedy');
	dialog.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#speedy');
	dialog.addFooterLink('Berikan umpan balik', 'WT:TW');

	const form = new Morebits.QuickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Tandai halaman saja, jangan hapus',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: 'Jika Anda hanya ingin menandai halaman',
					checked: !(Twinkle.speedy.hasCSD || (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName')) || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						const cForm = event.target.form;
						const cChecked = event.target.checked;
						// enable talk page checkbox
						if (cForm.talkpage) {
							cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
						}
						// enable redirects checkbox
						cForm.redirects.checked = !cChecked;
						// enable delete multiple
						cForm.delmultiple.checked = false;
						// enable notify checkbox
						cForm.notify.checked = cChecked;
						// enable deletion notification checkbox
						cForm.warnusertalk.checked = !cChecked && !Twinkle.speedy.hasCSD;
						// enable multiple
						cForm.multiple.checked = false;
						// enable requesting creation protection
						cForm.salting.checked = false;

						Twinkle.speedy.callback.modeChanged(cForm);

						event.stopPropagation();
					}
				}
			]
		});

		const deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: 'Pilihan penghapusan terkait'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) { // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append({
				type: 'checkbox',
				list: [
					{
						label: 'Juga hapus halaman pembicaraan',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "Opsi ini memungkinkan penghapusan halaman pembicaraan yang terkait dengan halaman utama. Namun, jika penghapusan dilakukan berdasarkan kriteria B8 (pemindahan ke Wikimedia Commons), maka halaman pembicaraan akan tetap dipertahankan dan tidak dihapus.",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						event: function(event) {
							event.stopPropagation();
						}
					}
				]
			});
		}
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Juga hapus semua pengalihan',
					value: 'redirects',
					name: 'redirects',
					tooltip: 'Opsi ini memungkinkan penghapusan semua pengalihan yang masuk secara otomatis; namun, sebaiknya dihindari dalam kasus penghapusan prosedural seperti pemindahan atau penggabungan halaman, agar tidak mengganggu alur navigasi yang sudah ada.',
					checked: Twinkle.getPref('deleteRedirectsOnDelete'),
					event: function (event) {
						event.stopPropagation();
					}
				},
				{
					label: 'Hapus dengan beberapa kriteria',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: 'Jika opsi ini dipilih, Anda dapat menetapkan lebih dari satu kriteria penghapusan cepat untuk sebuah halaman.',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				},
				{
					label: 'Beri tahu pembuat halaman untuk penghapusan halaman',
					value: 'warnusertalk',
					name: 'warnusertalk',
					tooltip: 'Jika Anda mengaktifkan notifikasi di preferensi Twinkle, maka templat notifikasi akan secara otomatis ditempatkan di halaman pembicaraan pembuat halaman saat Anda menandai halaman untuk penghapusan cepat.',
					checked: !Twinkle.speedy.hasCSD,
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
	}

	const tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	if (Morebits.userIsSysop) {
		tagOptions.append({
			type: 'header',
			label: 'Opsi terkait tag'
		});
	}

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Beri tahu ',
				value: 'notify',
				name: 'notify',
				tooltip: 'Templat notifikasi akan otomatis ditempatkan di halaman pembicaraan pembuat halaman jika Anda telah mengaktifkan fitur notifikasi dalam preferensi Twinkle Anda.',
				checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
				event: function(event) {
					event.stopPropagation();
				}
			},
			{
				label: 'Tag untuk proteksi pembuatan (salting) juga',
				value: 'salting',
				name: 'salting',
				tooltip: 'Jika opsi ini dipilih, tag penghapusan cepat akan disertai dengan permintaan penandaan {{salt}}, yang bertujuan untuk menghapus perlindungan pembuatan oleh pengurus. Gunakan opsi ini hanya jika halaman tersebut telah dibuat berulang kali secara problematis.',
				event: function(event) {
					event.stopPropagation();
				}
			},
			{
				label: 'Menandai dengan beberapa kriteria',
				value: 'multiple',
				name: 'multiple',
				tooltip: 'Jika opsi ini dipilih, Anda dapat menetapkan lebih dari satu kriteria penghapusan cepat untuk sebuah artikel. Sebagai contoh, kombinasi B11 dan A7 sering digunakan bersama untuk menandai artikel yang tidak memenuhi standar kelayakan dan verifikasi.',
				event: function(event) {
					Twinkle.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});

	form.append({
		type: 'div',
		id: 'prior-deletion-count',
		style: 'font-style: italic'
	});

	form.append({
		type: 'div',
		name: 'work_area',
		label: 'Gagal memulai modul KPC. Silakan coba lagi, atau laporkan masalah ini kepada pengembang Twinkle.'
	});

	if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
	}

	const result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	const namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	const mode = {
		isSysop: !!form.tag_only && !form.tag_only.checked,
		isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
		isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
	};

	if (mode.isSysop) {
		$('[name=delete_options]').show();
		$('[name=tag_options]').hide();
		$('button.tw-speedy-submit').text('Hapus halaman');
	} else {
		$('[name=delete_options]').hide();
		$('[name=tag_options]').show();
		$('button.tw-speedy-submit').text('Tandai halaman');
	}

	const work_area = new Morebits.QuickForm.Element({
		type: 'div',
		name: 'work_area'
	});

	if (mode.isMultiple && mode.isRadioClick) {
		const evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'Setelah memilih kriteria, klik:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: mode.isSysop ? 'Hapus halaman' : 'Tandai halaman',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	const appendList = function(headerLabel, csdList) {
		work_area.append({ type: 'header', label: headerLabel });
		work_area.append({ type: mode.isMultiple ? 'checkbox' : 'radio', name: 'csd', list: Twinkle.speedy.generateCsdList(csdList, mode) });
	};

	if (mode.isSysop && !mode.isMultiple) {
		appendList('Kriteria khusus', Twinkle.speedy.customRationale);
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		appendList('Halaman pembicaraan', Twinkle.speedy.talkList);
	}

	if (!Morebits.isPageRedirect()) {
		switch (namespace) {
			case 0: // article
			case 1: // talk
				appendList('Kriteria Artikel (A)', Twinkle.speedy.articleList);
				break;

			case 2: // user
			case 3: // user talk
				appendList('Halaman pengguna', Twinkle.speedy.userList);
				break;

			case 6: // file
			case 7: // file talk
				appendList('Files', Twinkle.speedy.fileList);
				if (!mode.isSysop) {
					work_area.append({ type: 'div', label: 'Penandaan untuk KPC B4 (tidak ada lisensi), B5 (berkas nonbebas tidak digunakan), B6 (tidak ada lisensi penggunaan tak bebas), dan B11 (tidak ada izin) dapat dilakukan melalui tab "DI" pada Twinkle.'});
				}
				break;

			case 10: // template
			case 11: // template talk
			case 828: // module
			case 829: // module talk
				appendList('Templat dan modul', Twinkle.speedy.templateList);
				break;

			case 14: // category
			case 15: // category talk
				appendList('Kategori', Twinkle.speedy.categoryList);
				break;

			default:
				break;
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			appendList('Halaman pengguna', Twinkle.speedy.userList);
		}
		appendList('Pengalihan', Twinkle.speedy.redirectList);
	}

	let generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('Kriteria umum (U)', generalCriteria);

	const old_area = Morebits.QuickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		const customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
		}
	}
};

Twinkle.speedy.callback.priorDeletionCount = function () {
	const query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5 // A little bit goes a long way
	};

	new Morebits.wiki.Api('Memeriksa penghapusan sebelumnya', query, ((apiobj) => {
		const response = apiobj.getResponse();
		const delCount = response.query.logevents.length;
		if (delCount) {
			let message = delCount + ' penghapusan sebelumnya';
			if (delCount > 1) {
				message += 's';
				if (response.continue) {
					message = 'Lebih dari ' + message;
				}

				// 3+ seems problematic
				if (delCount >= 3) {
					$('#prior-deletion-count').css('color', 'red');
				}
			}

			// Provide a link to page logs (CSD templates have one for sysops)
			const link = Morebits.htmlNode('a', '(logs)');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	})).post();
};

Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	const pageNamespace = mw.config.get('wgNamespaceNumber');

	const openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	const submitSubgroupHandler = function(e) {
		const evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, (critElement) => {
		const criterion = $.extend({}, critElement);

		if (mode.isMultiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (mode.isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && !criterion.showInNamespaces.includes(pageNamespace)) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.includes(pageNamespace)) {
			return null;
		}

		if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: mode.isSysop ? 'Hapus halaman' : 'Tandai halaman',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit', // ends up being called "csd.submit" so this is OK
						label: mode.isSysop ? 'Hapus halaman' : 'Tandai halaman',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		let code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{db-multiple';
			params.utparams = {};
			$.each(params.normalizeds, (index, norm) => {
				code += '|' + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (const i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) { // skip numeric parameters - {{db-multiple}} doesn't understand them
						code += '|' + i + '=' + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += '}}';
		} else {
			parameters = params.templateParams[0] || [];
			code = '{{db-' + params.values[0];
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += '|' + i + '=' + parameters[i];
				}
			}
			if (params.usertalk) {
				code += '|help=off';
			}
			code += '}}';
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		const query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		const statusIndicator = new Morebits.Status('Membuat ringkasan penghapusan');
		const api = new Morebits.wiki.Api('Mengambil templat penghapusan', query, ((apiobj) => {
			const reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('Tidak dapat membuat ringkasan dari templat penghapusan karena alasan atau parameter yang diperlukan tidak tersedia atau tidak valid. Silakan periksa kembali masukan dari Anda.');
			} else {
				statusIndicator.info('complete');
			}
			callback(reason);
		}), statusIndicator);
		api.post();
	},

	noteToCreator: function(pageobj) {
		const params = pageobj.getCallbackParameters();
		let initialContrib = pageobj.getCreator();

		// disallow notifying yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			Morebits.Status.warn('Anda (' + initialContrib + ') membuat halaman ini; melewati notifikasi pengguna');
			initialContrib = null;

		// don't notify users when their user talk page is nominated/deleted
		} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
			Morebits.Status.warn('Pemberitahuan kepada kontributor awal dilewati karena pengguna ini membuat halaman pembicaraan pengguna mereka sendiri.');
			initialContrib = null;

		// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
		} else if ((initialContrib === 'Cyberbot I' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'b2') {
			Morebits.Status.warn('Pemberitahuan kepada kontributor awal dilewati karena halaman dibuat secara prosedural oleh bot.');
			initialContrib = null;

		// Check for already existing tags
		} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('Halaman sudah punya tag penghapusan dan pembuatnya tampaknya sudah diberi tahu. Apakah Anda tetap ingin memberitahukannya lagi untuk penghapusan ini?')) {
			Morebits.Status.info('Memberitahu kontributor awal', 'dibatalkan oleh pengguna; melewati notifikasi..');
			initialContrib = null;
		}

		if (initialContrib) {
			const usertalkpage = new Morebits.wiki.Page('Pembicaraan pengguna:' + initialContrib, 'Memberitahu penyunting awal (' + initialContrib + ')');
			let notifytext, i, editsummary;

			// special cases: "db" and "db-multiple"
			if (params.normalizeds.length > 1) {
				notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
				let count = 2;
				$.each(params.normalizeds, (index, norm) => {
					notifytext += '|' + count++ + '=' + norm.toUpperCase();
				});
			} else if (params.normalizeds[0] === 'db') {
				notifytext = '\n{{subst:db-reason-' + (params.warnUser ? 'deleted' : 'notice') + '|1=' + Morebits.pageNameNorm;
			} else if (params.normalizeds[0] === 'u4') {
				notifytext = '\n{{subst:db-repost-notice|1=' + Morebits.pageNameNorm;
			} else {
				notifytext = '\n{{subst:db-csd-' + (params.warnUser ? 'deleted' : 'notice') + '-custom|1=';
				if (params.values[0] === 'copypaste') {
					notifytext += params.templateParams[0].sourcepage;
				} else {
					notifytext += Morebits.pageNameNorm;
				}
				notifytext += '|2=' + params.values[0];
			}

			for (i in params.utparams) {
				if (typeof params.utparams[i] === 'string') {
					notifytext += '|' + i + '=' + params.utparams[i];
				}
			}
			notifytext += (params.welcomeuser ? '' : '|nowelcome=yes') + '}} ~~~~';

			editsummary = (params.warnUser) ? 'Notifikasi: penghapusan cepat' : 'Notifikasi: nominasi penghapusan cepat';
			if (!params.normalizeds.includes('u10')) { // no article name in summary for G10 taggings
				editsummary += ' dari [[:' + Morebits.pageNameNorm + ']].';
			} else {
				editsummary += ' dari halaman serangan.';
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('watchSpeedyUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(() => {
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
				}
			}, () => {
				// if user could not be notified, log nomination without mentioning that notification was sent
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, null);
				}
			});
		} else if (params.lognomination) {
			// log nomination even if the user notification wasn't sent
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
	},

	sysop: {
		main: function(params) {
			let reason;
			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('Ringkasan penghapusan: Masukkan alasan singkat untuk penghapusan halaman ini.', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				const code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, (reason) => {
					if (params.promptForSummary) {
						reason = prompt('Masukkan ringkasan singkat dan jelas untuk penghapusan, atau tekan OK untuk menggunakan ringkasan otomatis dari sistem.', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			const thispage = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Menghapus halaman');

			if (reason === null) {
				return Morebits.Status.error('Berikan alasan penghapusan', 'Pengguna membatalkan');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.Status.error('Berikan alasan penghapusan', 'Penghapusan dibatalkan karena tidak ada alasan yang diberikan, atau Twinkle gagal menyelesaikan prosesnya. Silakan periksa kembali parameter yang dimasukkan dan pastikan alasan penghapusan sesuai dengan kriteria yang berlaku.');
			}

			const deleteMain = function(callback) {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(() => {
					thispage.getStatusElement().info('done');
					typeof callback === 'function' && callback();
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.warnUser) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation((pageobj) => {
					deleteMain(() => {
						Twinkle.speedy.callbacks.noteToCreator(pageobj);
					});
				});
			} else {
				deleteMain();
			}
		},
		deleteTalk: function(params) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'b8' &&
					!document.getElementById('ca-talk').classList.contains('new')) {
				const talkpage = new Morebits.wiki.Page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Menghapus halaman pembicaraan');
				talkpage.setEditSummary('[[WP:KPC#U8|U8]]: Halaman pembicaraan dari halaman yang dihapus [[' + mw.config.get('wgTitle') + ']]');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(() => {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				const query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
				};
				const wikipedia_api = new Morebits.wiki.Api('mengambil daftar pengalihan...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.Status('Menghapus pengalihan...'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			let $link, $bigtext;
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'b8') {
				$link = $('<a>', {
					href: '#',
					text: 'Silakan klik di sini untuk membuka alat Unlink',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Hapus semua pranala ke dan dari berkas yang telah dihapus: ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span>', {
					text: 'Hapus semua pranala balik dan hapus semua penggunaan berkas.',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.Status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'b8') {
				$link = $('<a>', {
					href: '#',
					text: 'Klik di sini untuk membuka alat Unlink.',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Menghapus pranala yang mengarah ke halaman yang sudah dihapus ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span>', {
					text: 'Menuju ke pranala balik yang yatim',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.Status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			const response = apiobj.getResponse();
			const snapshot = response.query.pages[0].redirects || [];
			const total = snapshot.length;
			const statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('tidak ada pengalihan ditemukan');
				return;
			}

			statusIndicator.status('0%');

			let current = 0;
			const onsuccess = function(apiobjInner) {
				const now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + ' (selesai)');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			snapshot.forEach((value) => {
				const title = value.title;
				const page = new Morebits.wiki.Page(title, 'Menghapus pengalihan "' + title + '"');
				page.setEditSummary('[[WP:KPC#U8|U8]]: Mengalihkan ke halaman yang dihapus [[' + Morebits.pageNameNorm + ']]');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			const statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("Halaman tidak ditemukan; mungkin sudah dihapus.");
				return;
			}

			const params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			const buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params);
			let code = buildData[0];
			params.utparams = buildData[1];

			// Set the correct value for |ts= parameter in {{db-g13}}
			// if (params.normalizeds.includes('g13')) {
			// 	code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			// }

			// Tag if possible, post on talk if not
			if (pageobj.canEdit() && ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].includes(pageobj.getContentModel()) && mw.config.get('wgNamespaceNumber') !== 710 /* TimedText */) {
				let text = pageobj.getPageText();

				statelem.status('Memeriksa tag di halaman...');

				// check for existing deletion tags
				const tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text);
				// This won't make use of the db-multiple template but it probably should
				if (tag && !confirm('Halaman sudah terdapat templat KPC {{' + tag[1] + '}}. Ingin menambahkan templat KPC lain?')) {
					return;
				}

				const xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(RfD)/.exec(text);
				if (xfd && !confirm('Ditemukan templat penghapusan {{' + xfd[1] + '}} di halaman. Tetap ingin menambahkan templat KPC?')) {
					return;
				}

				// curate/patrol the page
				if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
					pageobj.triage();
				}

				// Wrap SD template in noinclude tags if we are in template space.
				// Won't work with userboxes in userspace, or any other transcluded page outside template space
				if (mw.config.get('wgNamespaceNumber') === 10) { // Template:
					code = '<noinclude>' + code + '</noinclude>';
				}

				// Remove tags that become superfluous with this action
				text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
				if (mw.config.get('wgNamespaceNumber') === 6) {
					// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|pindah ke wikimedia commons|salin ke wikimedia commons)[^}]*\}\}/gi, '');
				}

				if (params.requestsalt) {
					if (!params.normalizeds.includes('u10')) {
						code += '\n{{salt}}';
					} else {
						code = '{{salt}}\n' + code;
					}
				}

				if (mw.config.get('wgPageContentModel') === 'Scribunto') {
					// Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
					let equals = '';
					while (code.includes(']' + equals + ']')) {
						equals += '=';
					}
					code = "membutuhkan('Modul:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
				} else if (['javascript', 'css', 'sanitized-css'].includes(mw.config.get('wgPageContentModel'))) {
					// Likewise for JS/CSS pages
					code = '/* ' + code + ' */';
				}

				// Generate edit summary for edit
				let editsummary;
				if (params.normalizeds.length > 1) {
					editsummary = 'Meminta penghapusan cepat (';
					$.each(params.normalizeds, (index, norm) => {
						editsummary += '[[WP:KPC#' + norm.toUpperCase() + '|KPC ' + norm.toUpperCase() + ']], ';
					});
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ').';
				} else if (params.normalizeds[0] === 'db') {
					editsummary = 'Meminta [[WP:KPC|penghapusan cepat]] dengan kriteria "' + params.templateParams[0]['1'];
				} else {
					editsummary = 'Meminta penghapusan cepat ([[WP:KPC#' + params.normalizeds[0].toUpperCase() + '|KPC ' + params.normalizeds[0].toUpperCase() + ']])';
				}

				// Blank attack pages
				if (params.normalizeds.includes('u10')) {
					text = code;
				} else {
					// Insert tag after short description or any hatnotes
					const wikipage = new Morebits.wikitext.Page(text);
					text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				}

				pageobj.setPageText(text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(params.watch);
				pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
			} else { // Attempt to place on talk page
				const talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
				if (talkName !== pageobj.getPageName()) {
					if (params.requestsalt) {
						code += '\n{{salt}}';
					}

					pageobj.getStatusElement().warn('Tidak dapat mengakses halaman penyuntingan, sehingga tag ditempatkan di halaman pembicaraan sebagai gantinya.');

					const talkPage = new Morebits.wiki.Page(talkName, 'Menaruh secara otomatis di halaman pembicaraan');
					talkPage.setNewSectionTitle(pageobj.getPageName() + ' dinominasikan untuk KPC, meminta penghapusan');
					talkPage.setNewSectionText(code + '\n\nSaya tidak dapat menandai ' + pageobj.getPageName() + ' jadi tolong hapus. ~~~~');
					talkPage.setCreateOption('recreate');
					talkPage.setFollowRedirect(true);
					talkPage.setWatchlist(params.watch);
					talkPage.setChangeTags(Twinkle.changeTags);
					talkPage.setCallbackParameters(params);
					talkPage.newSection(Twinkle.speedy.callbacks.user.tagComplete);
				} else {
					pageobj.getStatusElement().error('Halaman tidak dapat disunting dan tidak tersedia lokasi alternatif untuk menempatkan permintaan, sehingga proses dibatalkan.');
				}
			}
		},

		tagComplete: function(pageobj) {
			const params = pageobj.getCallbackParameters();

			// Notification to first contributor, will also log nomination to the user's userspace log
			if (params.usertalk) {
				const thispage = new Morebits.wiki.Page(Morebits.pageNameNorm);
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.speedy.callbacks.noteToCreator);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		addToLog: function(params, initialContrib) {
			const usl = new Morebits.UserspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"Ini adalah daftar lengkap semua catatan dari nominasi penghapusan cepat yang diajukan oleh pengguna ini menggunakan modul KPC dari Twinkle.\n\n" +
				'Jika Anda tidak ingin menyimpan catatan ini, Anda dapat menonaktifkannya melalui [[Wikipedia:Twinkle/Preferencespanel preferensi]], lalu nominasikan halaman ini untuk penghapusan cepat dengan kriteria KPC U1.' +
				(Morebits.userIsSysop ? '\n\Catatan ini tidak mencatat diluar penghapusan cepat yang dibuat dengan Twinkle.' : '');

			const formatParamLog = function(normalize, csdparam, input) {
				if ((normalize === 'G4' && csdparam === 'xfd') ||
					(normalize === 'G6' && csdparam === 'page') ||
					(normalize === 'G6' && csdparam === 'fullvotepage') ||
					(normalize === 'G6' && csdparam === 'sourcepage') ||
					(normalize === 'A2' && csdparam === 'source') ||
					(normalize === 'A10' && csdparam === 'article') ||
					(normalize === 'F1' && csdparam === 'filename')) {
					input = '[[:' + input + ']]';
				} else if (normalize === 'G5' && csdparam === 'user') {
					input = '[[:Pengguna:' + input + ']]';
				} else if (normalize === 'G12' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
					input = '[' + input + ' ' + input + ']';
				} else if (normalize === 'F8' && csdparam === 'filename') {
					input = '[[commons:' + input + ']]';
				}
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			let extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			const fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([catatan {{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}}])' : '';

			let editsummary = 'Mencatat nominansi penghapusan cepat';
			let appendText = '# [[:' + Morebits.pageNameNorm;

			if (!params.normalizeds.includes('u10')) { // no article name in log for G10 taggings
				appendText += ']]' + fileLogLink + ': ';
				editsummary += ' dari [[:' + Morebits.pageNameNorm + ']].';
			} else {
				appendText += '|Halaman]] serangan ini' + fileLogLink + ': ';
				editsummary += ' dari halaman serangan.';
			}
			if (params.normalizeds.length > 1) {
				appendText += 'multiple criteria (';
				$.each(params.normalizeds, (index, norm) => {
					appendText += '[[WP:KPC#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2); // remove trailing comma
				appendText += ')';
			} else if (params.normalizeds[0] === 'db') {
				appendText += '{{tl|db-reason}}';
			} else {
				appendText += '[[WP:KPC#' + params.normalizeds[0].toUpperCase() + '|KPC ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.values[0] + '}})';
			}

			// If params is "empty" it will still be full of empty arrays, but ask anyway
			if (params.templateParams) {
				// Treat custom rationale individually
				if (params.normalizeds[0] && params.normalizeds[0] === 'db') {
					extraInfo += formatParamLog('Kustom', 'rationale', params.templateParams[0]['1']);
				} else {
					params.templateParams.forEach((item, index) => {
						const keys = Object.keys(item);
						if (keys[0] !== undefined && keys[0].length > 0) {
							// Second loop required since some items (G12, F9) may have multiple keys
							keys.forEach((key, keyIndex) => {
								if (keys[keyIndex] === 'blanked' || keys[keyIndex] === 'ts') {
									return true; // Not worth logging
								}
								extraInfo += formatParamLog(params.normalizeds[index].toUpperCase(), keys[keyIndex], item[key]);
							});
						}
					});
				}
			}

			if (params.requestsalt) {
				appendText += '; meminta perlindungan pembuatan berulang';
			}
			if (extraInfo) {
				appendText += '; informasi tambahan:' + extraInfo;
			}
			if (initialContrib) {
				appendText += '; {{user|1=' + initialContrib + '}} diberitahu';
			}
			appendText += ' ~~~~~\n';

			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, editsummary);
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	let parameters = [];

	$.each(values, (index, value) => {
		const currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					const dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Kriteria kustom: Silakan tuliskan alasan atau kriteria penghapusan cepat yang tidak tercakup dalam daftar standar.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'userreq': // U1
				if (form['csd.userreq_rationale']) {
					const u1rationale = form['csd.userreq_rationale'].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
						alert('KPC H1: Saat menominasikan halaman pembicaraan pengguna untuk penghapusan cepat, harap sebutkan alasan atau kriteria nominasi secara jelas agar proses dapat ditinjau dengan tepat.');
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'repost': // G4
				if (form['csd.repost_xfd']) {
					const deldisc = form['csd.repost_xfd'].value;
					if (deldisc) {
						currentParams.xfd = deldisc;
					}
				}
				break;

			case 'banned': // G5
				if (form['csd.banned_user'] && form['csd.banned_user'].value) {
					currentParams.user = form['csd.banned_user'].value.replace(/^\s*Pengguna:/i, '');
				}
				break;

			case 'move': // G6
				if (form['csd.move_page'] && form['csd.move_reason']) {
					const movepage = form['csd.move_page'].value,
						movereason = form['csd.move_reason'].value;
					if (!movepage || !movepage.trim()) {
						alert('KPC U6 (pemindahan): Silakan sebutkan nama halaman sumber yang ingin dipindahkan ke halaman ini.');
						parameters = null;
						return false;
					}
					if (!movereason || !movereason.trim()) {
						alert('KPC U6 (pemindahan): Silakan berikan alasan mengapa halaman tersebut perlu dipindahkan ke judul ini.');
						parameters = null;
						return false;
					}
					currentParams.page = movepage;
					currentParams.reason = movereason;
				}
				break;

			case 'xfd': // G6
				if (form['csd.xfd_fullvotepage']) {
					const xfd = form['csd.xfd_fullvotepage'].value;
					if (xfd) {
						currentParams.fullvotepage = xfd;
					}
				}
				break;

			case 'afc-move': // G6
				if (form['csd.draft_page']) {
					const draftpage = form['csd.draft_page'].value;
					if (!draftpage || !draftpage.trim()) {
						alert('KPC U6 (pemindahan AfC): Silakan sebutkan nama halaman draf yang ingin Anda pindahkan ke halaman ini.');
						parameters = null;
						return false;
					}
					currentParams.page = draftpage;
				}
				break;

			case 'copypaste': // G6
				if (form['csd.copypaste_sourcepage']) {
					const copypaste = form['csd.copypaste_sourcepage'].value;
					if (!copypaste || !copypaste.trim()) {
						alert('KPC U6 (salin-tempel):  Tolong berikan sumber nama halaman.');
						parameters = null;
						return false;
					}
					currentParams.sourcepage = copypaste;
				}
				break;

			case 'u6': // G6
				if (form['csd.g6_rationale'] && form['csd.g6_rationale'].value) {
					currentParams.rationale = form['csd.g6_rationale'].value;
				}
				break;

			case 'author': // G7
				if (form['csd.author_rationale'] && form['csd.author_rationale'].value) {
					currentParams.rationale = form['csd.author_rationale'].value;
				}
				break;

			case 'u8': // G8
				if (form['csd.g8_rationale'] && form['csd.g8_rationale'].value) {
					currentParams.rationale = form['csd.g8_rationale'].value;
				}
				break;

			case 'attack': // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio': // G12
				if (form['csd.copyvio_url'] && form['csd.copyvio_url'].value) {
					currentParams.url = form['csd.copyvio_url'].value;
				}
				if (form['csd.copyvio_url2'] && form['csd.copyvio_url2'].value) {
					currentParams.url2 = form['csd.copyvio_url2'].value;
				}
				if (form['csd.copyvio_url3'] && form['csd.copyvio_url3'].value) {
					currentParams.url3 = form['csd.copyvio_url3'].value;
				}
				break;

			case 'afc': // G13
				if (form['csd.g13_rationale'] && form['csd.g13_rationale'].value) {
					currentParams.rationale = form['csd.g13_rationale'].value;
				} // to be replaced by the last revision timestamp when page is saved
				break;

			/*case 'llm': // G15
				if ( form['csd.subcriteria'] && form['csd.subcriteria'].value) {
					if (form['csd.subcriteria'].value === 'communication') {
						currentParams.communication = 'yes';
					} else if (form['csd.subcriteria'].value === 'nonsensical' || form['csd.subcriteria'].value === 'implausible') {
						currentParams.references = 'yes';
						if ( form['csd.subcriteria'].value === 'nonsensical' ) {
							currentParams.reason = 'Nonsensical references';
						} else {
							currentParams.reason = 'Implausible references';
						}

						if (form['csd.reason'] && form['csd.reason'].value) {
							currentParams.reason += ': ' + form['csd.reason'].value;
						}
					}
				}

				if (form['csd.reason'] && form['csd.reason'].value && !(form['csd.subcriteria'] && form['csd.subcriteria'].value)) {
					currentParams.reason = form['csd.reason'].value;
				}
				break; */

			case 'redundantimage': // F1
				if (form['csd.redundantimage_filename']) {
					const redimage = form['csd.redundantimage_filename'].value;
					if (!redimage || !redimage.trim()) {
						alert('KPC B1: Silakan berikan nama berkas lain yang sudah ada di Wikipedia untuk dibandingkan atau dijadikan referensi.');
						parameters = null;
						return false;
					}
					currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(redimage) ? redimage : 'Berkas:' + redimage;
				}
				break;

			case 'badfairuse': // F7
				if (form['csd.badfairuse_rationale'] && form['csd.badfairuse_rationale'].value) {
					currentParams.rationale = form['csd.badfairuse_rationale'].value;
				}
				break;

			case 'commons': // F8
				if (form['csd.commons_filename']) {
					const filename = form['csd.commons_filename'].value;
					if (filename && filename.trim() && filename !== Morebits.pageNameNorm) {
						currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(filename) ? filename : 'Berkas:' + filename;
					}
				}
				break;

			case 'imgcopyvio': // F9
				if (form['csd.imgcopyvio_url'] && form['csd.imgcopyvio_rationale']) {
					const f9url = form['csd.imgcopyvio_url'].value;
					const f9rationale = form['csd.imgcopyvio_rationale'].value;
					if ((!f9url || !f9url.trim()) && (!f9rationale || !f9rationale.trim())) {
						alert('KPC B9: Saat menominasikan berkas di bawah kriteria ini, Anda wajib menyertakan URL sumber asli, alasan mengapa berkas tersebut melanggar hak cipta, atau keduanya.');
						parameters = null;
						return false;
					}
					if (form['csd.imgcopyvio_url'].value) {
						currentParams.url = f9url;
					}
					if (form['csd.imgcopyvio_rationale'].value) {
						currentParams.rationale = f9rationale;
					}
				}
				break;

			case 'foreign': // A2
				if (form['csd.foreign_source']) {
					const foreignlink = form['csd.foreign_source'].value;
					if (!foreignlink || !foreignlink.trim()) {
						alert('KPC A2: Silakan berikan pranala interwiki ke artikel di proyek Wikimedia lain (misalnya Wikipedia bahasa Inggris) yang merupakan salinan dari halaman ini.');
						parameters = null;
						return false;
					}
					currentParams.source = foreignlink;
				}
				break;

			case 'a10': // A10
				if (form['csd.a10_article']) {
					const duptitle = form['csd.a10_article'].value;
					if (!duptitle || !duptitle.trim()) {
						alert('KPC A10: Silakan berikan nama artikel lain yang isinya sama atau sangat mirip dengan halaman ini.');
						parameters = null;
						return false;
					}
					currentParams.article = duptitle;
				}
				break;

			case 'c4': // C4
				if (form['csd.c4_rationale'] && form['csd.c4_rationale'].value) {
					currentParams.rationale = form['csd.c4_rationale'].value;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// Function for processing talk page notification template parameters
// key1/value1: for {{db-criterion-[notice|deleted]}} (via {{db-csd-[notice|deleted]-custom}})
// utparams.param: for {{db-[notice|deleted]-multiple}}
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) {
	const utparams = [];

	// Special cases
	if (normalized === 'db') {
		utparams['2'] = parameters['1'];
	} else if (normalized === 'u6') {
		utparams.key1 = 'to';
		utparams.value1 = Morebits.pageNameNorm;
	} else if (normalized === 'u12') {
		['url', 'url2', 'url3'].forEach((item, idx) => {
			if (parameters[item]) {
				idx++;
				utparams['key' + idx] = item;
				utparams['value' + idx] = utparams[item] = parameters[item];
			}
		});
	} else {
		// Handle the rest
		let param;
		switch (normalized) {
			case 'u4':
				param = 'xfd';
				break;
			case 'a2':
				param = 'source';
				break;
			case 'a10':
				param = 'article';
				break;
			case 'b9':
				param = 'url';
				break;
			default:
				break;
		}
		// No harm in providing a usertalk template with the others' parameters
		if (param && parameters[param]) {
			utparams.key1 = param;
			utparams.value1 = utparams[param] = parameters[param];
		}
	}
	return utparams;
};

/**
 * @param {Event} e
 * @return {Array}
 */
Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	const values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('Tolong pilih kriteria!');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	const form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	const tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	const values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	const templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	const normalizeds = values.map((value) => Twinkle.speedy.normalizeHash[value]);

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	let watchPage, promptForSummary;
	normalizeds.forEach((norm) => {
		if (Twinkle.getPref('watchSpeedyPages').includes(norm)) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').includes(norm)) {
			promptForSummary = true;
		}
	});

	const warnusertalk = form.warnusertalk.checked && normalizeds.some((norm, index) => Twinkle.getPref('warnUserOnSpeedyDelete').includes(norm) &&
			!(norm === 'u6' && values[index] !== 'copypaste'));

	const welcomeuser = warnusertalk && normalizeds.some((norm) => Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').includes(norm));

	const params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		warnUser: warnusertalk,
		welcomeuser: welcomeuser,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	const form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	const values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	const templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;

	const normalizeds = values.map((value) => Twinkle.speedy.normalizeHash[value]);

	// analyse each criterion to determine whether to watch the page/notify the creator
	const watchPage = normalizeds.some((csdCriteria) => Twinkle.getPref('watchSpeedyPages').includes(csdCriteria)) && Twinkle.getPref('watchSpeedyExpiry');

	const notifyuser = form.notify.checked && normalizeds.some((norm, index) => Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').includes(norm) &&
			!(norm === 'u6' && values[index] !== 'copypaste'));
	const welcomeuser = notifyuser && normalizeds.some((norm) => Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').includes(norm));
	const csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some((norm) => !Twinkle.getPref('noLogOnSpeedyNomination').includes(norm));

	const params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Menandai selesai';

	const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Menandai halaman');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
}());

// </nowiki>
