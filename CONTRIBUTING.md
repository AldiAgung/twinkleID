# Kontribusi ke Twinkle

:tada::tada: Terimakasih telah meluangkan waktu untuk berkontribusi! :tada::tada:

Banyak cara untuk membantu!

## Pelaporan galat dan permintaan fitur

Jika anda menemukan sebuah galat, hebat! Anda dapat [open a new GitHub issue here](https://github.com/azatoth/twinkle/issues/new) (GitHub account required) atau dapat melaporkannya di [Pembicaraan Wiki:Twinkle][Pembicaraan Wiki:Twinkle]. Perubahan besar atau permintaan sulit harus dibuat dalam wiki jadi pengguna lainnya dapat mengambil bagian di dalam diskusi di proposal fitur anda. Jika anda tidak yakin bahwa sesuatu merupakan sebuah galat, penyunting lain dapat membantu mencari masalahnya. Pastikan untuk mencari arsip halaman pembicaraan dan  isu GitHub untuk melihat permintaan anda telah didiskusikan pada masa lalu.

Apapun permasalahannya, deskripsikan lebih detail permasalahnnya untuk mempermudah merespon laporan atau permintaan anda.

### Melaporkan sebuah galat

Penulisan laporan galat yang bagus terdiri dari:

- Pengenalan singkat, judul deskriptif yang menandai modul yang anda gunakan (tag, CSD, xfd, etc.).
- The steps leading up to the issue so we can replicate it.  This should include the page and revision you were on, the action you were performing, and the options you selected.
- Any errors or messages that Twinkle reported an error when it got stuck.
- Hal yang *harus* terjadi.
- Semua hal yang anda dapat temui di [browser's console window][jserrors].

Jika anda yakin menemukan sebuah masalah keamanan, ikuti panduan di [SECURITY.md](./SECURITY.md).

## Kontribusi sebuah pull request

### Untuk memulai

Jika anda ingin membantu pengembangan Twinkle, sangat indah! Siapapun dapat berkontribusi, dan mudah untuk melakukannya.

Pertama, ketahui dahulu terhadap kodenya; biasanya, perubahan yang anda inginkan merujuk pada salah satu [modules](./modules); anda juga dapat memeriksa [individual Gadget pages][twinkle_gadget] di wiki. Jika anda mengusulkan perubahan anda, [fork the repository](https://help.github.com/articles/fork-a-repo/) untuk memastikan selalu mempunyai versi terbaru. Jika anda baru ke GitHub atau Git secara umum, anda mungkin ingin membaca [Getting started with GitHub](https://help.github.com/en/github/getting-started-with-github) dahulu.

Saat anda mempunyai fork lokal dan berjalan, commit perubahan anda!

### Tes kode anda

Mencoba Twinkle dapat sedikit susah, but the most straightforward way to test your code is to open up your [browser's console window][jserrors] dan tempel di kode baru anda. You'll have to load the new version by running the corresponding function in your console, e.g., `Twinkle.protect()` for twinkleprotect.js.

Beberapa hal yang perlu diperhatikan:

- Jika pengujian anda membuat sebuah suntingan otomatis, pertimbangkan untuk membuatnya di kotak pasir; perhatikan beberapa hal tidak akan berjalan semestinya diluar ruangnama. Sebuah tempat yang lebih baik di [test wiki](http://test.wikipedia.org)!  Beberapa bagian dari Twinkle mengandalkan pada kode templat spesifik atau di preferensi wiki tertentu, maka dari itu menguji hal tertentu di luar idWiki dapat lebih sulit (mis., perubahan tertunda).
- The non-module scripts `morebits.js` and `twinkle.js` are usually more complicated to test.
- The `twinkleconfig` pseudo-module holds the code to save and determine user preferences, while `twinkle.js` holds the defaults.
- There is some variety in how the individual modules are written, in particular among the `friendly` family as well as with `twinkleconfig.js`.

Saat Twinkle digunakan ribuan kali per-harinya, perubahan kepada bagaimana Twinkle berkerja dapat membingungkan atau mengganggu kepada para peyunting. Signifikasi atau perubahan besar ke alur kerja, desain, atau fungsionalitas harus mencapai mayoritas konsensus sebelum dapat diputuskan atau disarankan, ataupun melewati [Pembicaraan Wiki:Twinkle] atau lainnya.

### Mengirim pull request anda

Saat anda ingin mengirim, commit perubahan anda di branch baru (buat branch dengan nama yang diinginkan tapi jangan menghapus awalan "pr/"), kemudian [initiate a pull request (PR)](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork).  Judul dari pull request harus berupa modul yang anda ingin ubah, diikuti deskripsi yang anda telah lakukan, seperti:

    xfd: Mencegah pengurus menghapus halaman utama

The usual rule of thumb is that a good subject line will complete the sentence "*If applied, this commit will...*"  The full commit message is a good place to explain further details, both for reviewers and anyone in the future, specifically focusing on *why* the changes are being made, not *how*.  There are many guides to writing good commit messages, one particularly helpful one is by @cbeams: https://chris.beams.io/posts/git-commit/

Jika anda membuat beberapa commit sementara bekerja di fitur yang sama, dianjurkan untuk [squash and rebase your commits](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) sebelum mengirimkan PR anda; sebuah kebijakan bagus bahwa setiap commit harus dapat mengganti berkas gawai di wiki secara langsung untuk semua pengguna. Ide dan peningkatan terpisah harus commit yang berbeda, dan konsep yang sepenunya berbeda harus pull requests yang berbeda.  Sebagai contoh, jika anda membuat commit tiga sementara mengganti pilihan gulir kebawah pada `twinkleprotect.js` dan `twinklebatchprotect.js`, maka harus dikemas menjadi satu commit, tetapi jika anda menonaktifkan pemuatan `twinklespeedy.js` dan `twinklexfd.js` di halaman utama, maka harus pull request yang berbeda. Lihat pula [how to file a bug report or feature request](README.md#how-to-file-a-bug-report-or-feature-request).

### Panduan gaya

Untuk konsistensi dan meminimalisir potensi galat, we've recently decided to utilize a more coherent style throughout the code.  [eslint][eslint.org] can be used to check your code before submission and even repair many common issues.  To install via `npm`, just run `npm install` from the main Twinkle directory in your terminal.  You can then freely check your code by running `npm run lint`, and if you run `npm run lint:fix` then `eslint` will clean up some (but not all!) style differences.  More information on specific style rules can be seen in [issue #500][fivehundred] and in `.eslintrc.json`, but the best advice is to just follow the style of surrounding code!  Some specific examples and deviations are elucidated below.

- Kutipan: pengutipan tunggal harus digunakan di sekitar string, seperti menggunakan `mw.config.get('wgUserName')`
- Spasi: `if (condition) {`
- Each: Metode `array.forEach(function(item) {` lebih digunakan daripada `$.each(array, function(index, item) {`

## Harapan kontributor

Semua orang dipersilakan untuk bergabung dan berkontribusi, terlepas dari pengalaman anda. Siapapun yang mengirim isu, kode, ulasan, atau komentar ke repositori diharapkan dapat melakukannya dengan mematuhi prinsip [Code of Conduct for technical spaces][conduct] Wikimedia.

[Pembicaraan Wiki:Twinkle]: https://id.wikipedia.org/wiki/Pembicaraan_Wikipedia:Twinkle
[jserrors]: https://en.wikipedia.org/wiki/Wikipedia:Reporting_JavaScript_errors
[twinkle_gadget]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle/Gadget
[Wikipedia:Twinkle]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle
[eslint.org]: https://eslint.org/
[fivehundred]: https://github.com/azatoth/twinkle/issues/500
[conduct]: https://www.mediawiki.org/wiki/Code_of_Conduct
