import { Book } from '../types/library';

const getDriveUrl = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`;

export const books: Book[] = [
  // --- BAC 2025 NEW BOOKS ---
  {
    id: 14,
    title: "سلاسل بالوريش - بكالوريا 2025",
    subject: "تمارين شاملة",
    cover: "https://picsum.photos/seed/balourish/400/600",
    pdfUrl: "https://drive.google.com/drive/folders/1eoG9s1XI89WkcQHIjni2tTGMbGth_kTx",
    branch: "sciences",
    author: "الأستاذ بالوريش"
  },
  {
    id: 15,
    title: "كتاب أحمد أمين خليفة - علوم طبيعية",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/amine/400/600",
    pdfUrl: "https://drive.google.com/drive/folders/1tCBBkBr0RYbCq5YXVioWnn-pBMw5mEu8",
    branch: "sciences",
    author: "أحمد أمين خليفة"
  },
  {
    id: 16,
    title: "السلسلة الفضية كاملة - علوم تجريبية",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/silver_full/400/600",
    pdfUrl: "https://drive.google.com/drive/folders/1gy64uzgF6pil9fTi5dcMGj9Qmy0we43Y",
    branch: "sciences",
    author: "السلسلة الفضية"
  },
  {
    id: 17,
    title: "ملخصات الأستاذ كحول هشام",
    subject: "الاجتماعيات",
    cover: "https://picsum.photos/seed/kahoul/400/600",
    pdfUrl: "https://drive.google.com/drive/folders/1cQHbLX4NHZH6hYvJlSgHv7d7a4gDgTPg",
    branch: "humanities",
    author: "كحول هشام"
  },
  {
    id: 18,
    title: "كتاب المراجعة النهائية - بكالوريا 2025",
    subject: "مراجعة شاملة",
    cover: "https://picsum.photos/seed/final_rev/400/600",
    pdfUrl: getDriveUrl("1go1DVRwPuSXOFBktGWBTpbUlfOiNua9v"),
    branch: "sciences",
    author: "وزارة التربية"
  },
  {
    id: 19,
    title: "النصوص العلمية - المجال الأول",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/sci_texts/400/600",
    pdfUrl: getDriveUrl("1stHtvTZLkiSjgyJYvJdmtX9yN7jHWqLu"),
    branch: "sciences",
    author: "نصوص علمية"
  },
  {
    id: 20,
    title: "السلسلة الفضية - شعبة رياضيات",
    subject: "الرياضيات",
    cover: "https://picsum.photos/seed/silver_math/400/600",
    pdfUrl: getDriveUrl("1v8mZBjI1tf6y3s5TGIft9QONIYQqXQvZ"),
    branch: "math",
    author: "السلسلة الفضية"
  },
  {
    id: 21,
    title: "كتاب الأستاذ رحمان طلحي",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/talhi/400/600",
    pdfUrl: getDriveUrl("1q4zADxj1AC_eEsAgSHDPzplY3N3M_EB-"),
    branch: "sciences",
    author: "رحمان طلحي"
  },
  {
    id: 22,
    title: "الرسومات التخطيطية اللازمة",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/drawings/400/600",
    pdfUrl: getDriveUrl("1edNOtBPbskUjFkYLkiExEmD1kPJFwdCr"),
    branch: "sciences",
    author: "رسومات تخطيطية"
  },
  {
    id: 23,
    title: "ملخص الأستاذ بن خريف",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/benkhrif/400/600",
    pdfUrl: getDriveUrl("1eQcSpf68cClGC_x19K9COPowEJDIgluX"),
    branch: "sciences",
    author: "بن خريف"
  },
  {
    id: 24,
    title: "ملخص الأستاذ فراح عيسى",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/farah/400/600",
    pdfUrl: getDriveUrl("1eGWIiZj4Fu5xQXYkVCOOuRjEGeVC5cHT"),
    branch: "sciences",
    author: "فراح عيسى"
  },
  {
    id: 25,
    title: "مجلة الأستاذة فليتي خيرة",
    subject: "الفيزياء",
    cover: "https://picsum.photos/seed/fliti/400/600",
    pdfUrl: getDriveUrl("1ec7nFMt7Wrn2mqKnjcWrEnuaYjZomo2p"),
    branch: "sciences",
    author: "فليتي خيرة"
  },
  {
    id: 26,
    title: "نصوص علمية شاملة",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/texts_full/400/600",
    pdfUrl: getDriveUrl("1eFYfn929tOhURcet11DCFneMevXifkyI"),
    branch: "sciences",
    author: "نصوص علمية"
  },
  // --- PREVIOUS BOOKS ---
  {
    id: 1,
    title: "كتاب الاجتماعيات - الأستاذ عمار بورنان (ط2)",
    subject: "الاجتماعيات",
    cover: "https://picsum.photos/seed/bournan/400/600",
    pdfUrl: getDriveUrl("1Fg05NTsMreO3KmkM9lEh3miaP2V-R2YM"),
    branch: "sciences",
    author: "عمار بورنان"
  },
  {
    id: 2,
    title: "كتاب الشريعة الإسلامية - الأستاذة بوسعادي (ط2)",
    subject: "الشريعة",
    cover: "https://picsum.photos/seed/bousadi/400/600",
    pdfUrl: getDriveUrl("1FjOSH1LgHBaX2wL-EN--1LhQyJXckJWc"),
    branch: "sciences",
    author: "الأستاذة بوسعادي"
  },
  {
    id: 3,
    title: "كتاب الفلسفة - هبة جبابرية (طبعة 2021)",
    subject: "الفلسفة",
    cover: "https://picsum.photos/seed/philosophy/400/600",
    pdfUrl: getDriveUrl("1Fm5i0lnpR7RnOlSl4ZASPti1WkoS7s9M"),
    branch: "arts",
    author: "هبة جبابرية"
  },
  {
    id: 4,
    title: "كتاب العلوم الطبيعية - إكرام بوزار (طبعة 2021)",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/biology/400/600",
    pdfUrl: getDriveUrl("1FpU8-PKZ_sJ9xuyi181mcMUhZA7eWkDr"),
    branch: "sciences",
    author: "إكرام بوزار"
  },
  {
    id: 5,
    title: "كتاب الاحتمالات - الأستاذ نور الدين",
    subject: "الرياضيات",
    cover: "https://picsum.photos/seed/math_prob/400/600",
    pdfUrl: getDriveUrl("1H3-ANi0N_p9902ycroYwJNpzUfMEwoth"),
    branch: "math",
    author: "نور الدين"
  },
  {
    id: 6,
    title: "كتاب الدوال - الأستاذ نور الدين (ط2)",
    subject: "الرياضيات",
    cover: "https://picsum.photos/seed/math_func/400/600",
    pdfUrl: getDriveUrl("1Fl8Pa2BhK0YV0mZjduyJF8oP6LhYn4SQ"),
    branch: "math",
    author: "نور الدين"
  },
  {
    id: 7,
    title: "تمارين السلسلة الفضية في العلوم (الإصدار 4)",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/silver_sci/400/600",
    pdfUrl: getDriveUrl("1VcGBTuZC7EIOsDLlC_iBRDVcP9nNRUFT"),
    branch: "sciences",
    author: "السلسلة الفضية"
  },
  {
    id: 8,
    title: "وحدة الاتصال العصبي - السلسلة الفضية (ط4)",
    subject: "العلوم الطبيعية",
    cover: "https://picsum.photos/seed/nerve/400/600",
    pdfUrl: getDriveUrl("1Z6fB-fpOPyoeQPYY3ks1CmKtQ6vLpH1u"),
    branch: "sciences",
    author: "السلسلة الفضية"
  },
  {
    id: 9,
    title: "السلسلة الأرجوانية في الشريعة - بوسعادي",
    subject: "الشريعة",
    cover: "https://picsum.photos/seed/purple_sharia/400/600",
    pdfUrl: getDriveUrl("1We5-poOxRZNYgYA7bskZYPWEPPc32Aj3"),
    branch: "humanities",
    author: "الأستاذة بوسعادي"
  },
  {
    id: 10,
    title: "كتاب النوابغ في الأدب العربي - الأستاذ حيقون",
    subject: "الأدب العربي",
    cover: "https://picsum.photos/seed/arabic_lit/400/600",
    pdfUrl: getDriveUrl("1WAVE_AObx4R2pB4a1hO4la4LmWKIQcID"),
    branch: "languages",
    author: "الأستاذ حيقون"
  },
  {
    id: 11,
    title: "السلسلة الأرجوانية في الاجتماعيات - بورنان (ط5)",
    subject: "الاجتماعيات",
    cover: "https://picsum.photos/seed/purple_hist/400/600",
    pdfUrl: getDriveUrl("1_2YNK9BNR9GBHnOcWDl62I5nPWbkb2g_"),
    branch: "humanities",
    author: "عمار بورنان"
  },
  {
    id: 12,
    title: "كتاب الجوهرة في الفيزياء (الوحدة الأولى)",
    subject: "الفيزياء",
    cover: "https://picsum.photos/seed/physics_gem/400/600",
    pdfUrl: getDriveUrl("1fDWUTytEODE-hyD4tDwV8UoALiEFQkwd"),
    branch: "technical",
    author: "كتاب الجوهرة"
  },
  {
    id: 13,
    title: "السلسلة الفضية في الاحتمالات - نور الدين (ط4)",
    subject: "الرياضيات",
    cover: "https://picsum.photos/seed/silver_prob/400/600",
    pdfUrl: getDriveUrl("1uDch6vY45SjFFRQzpY-FQG90Rufv3vYC"),
    branch: "math",
    author: "نور الدين"
  }
];
