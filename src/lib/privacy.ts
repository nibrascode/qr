import type { Lang } from "@/lib/i18n";

export type PolicySection = { h: string; body: string[] };

export type Policy = {
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
};

const CONTACT = "info@nibrascode.com";

export const PRIVACY: Record<Lang, Policy> = {
  az: {
    title: "Məxfilik siyasəti",
    updated: "Yenilənib: 8 oktyabr 2026",
    intro:
      "Nibras QR (NibrasCode) QR kod yaratmaq, skan etmək və dinamik QR statistikası üçün hazırlanmış alətdir. Bu səhifə Google ilə daxil olanda hansı məlumatın toplandığını və necə istifadə olunduğunu izah edir.",
    sections: [
      {
        h: "Kimik",
        body: [
          "Xidməti NibrasCode idarə edir. Hesab, QR kitabxanası və skan statistikası bu tətbiqin serverində saxlanılır.",
        ],
      },
      {
        h: "Google ilə daxil olma",
        body: [
          "Hesab yalnız Google OAuth ilə açılır. Google-dan ad və e-poçt ünvanı alınır. Profil şəkli göstərilmir.",
          "Google istifadəçi məlumatı reklam, satış və ya Google-dan kənar profil yaratmaq üçün istifadə olunmur. Məlumat yalnız tətbiqin göstərdiyi funksiyalar üçündür (Google API Services User Data Policy, Limited Use).",
          "Google-un öz məxfilik siyasəti hesabın Google tərəfində necə idarə olunduğunu əhatə edir. İcazəni Google hesab ayarlarından ləğv edə bilərsən.",
        ],
      },
      {
        h: "Topladığımız məlumat",
        body: [
          "Hesab: ad, e-poçt və daxili istifadəçi identifikatoru. Profil şəkli interfeysdə istifadə olunmur.",
          "Yaratdığın QR: ad, növ, məzmun (link, Wi-Fi, kontakt və s.), dizayn, qovluq, aktiv/deaktiv statusu.",
          "Dinamik QR skanı: vaxt, cihaz növü (mobil, kompüter, planşet) və təxmini ölkə. Dəqiq GPS və ya skan edənin adı saxlanılmır.",
          "Brauzerdə lokal: dil seçimi və skaner tarixçəsi. Bu, serverə göndərilmir.",
        ],
      },
      {
        h: "Məlumatdan necə istifadə edirik",
        body: [
          "Hesabını açmaq və QR-lərini yalnız sənə göstərmək.",
          "Dinamik QR-i çap olunmuş kodu dəyişmədən yeni ünvana yönləndirmək.",
          "Skan sayını, gün/ay qrafikini, cihaz və ölkə statistikasına çevirmək.",
          "Xidməti qorumaq, sui-istifadəni azaltmaq və dəstək vermək.",
        ],
      },
      {
        h: "Paylaşmadığımız şeylər",
        body: [
          "Şəxsi məlumatı satmırıq və reklam şəbəkələrinə vermirik.",
          "QR məzmunun və statistikan üçüncü tərəf marketinq alətlərinə göndərilmir.",
          "Qanun tələb edərsə və ya hüquqları qorumaq üçün məhdud açıqlama ola bilər.",
        ],
      },
      {
        h: "Saxlama və təhlükəsizlik",
        body: [
          "Sessiya şifrələnmiş kukidə saxlanılır. OAuth tokenləri serverdə şifrələnir.",
          "Ötürülmə HTTPS üzərindən gedir. Heç bir sistem tam təhlükəsiz deyil; şübhəli girişi Google hesabından yoxlaya bilərsən.",
        ],
      },
      {
        h: "Saxlama müddəti və silmə",
        body: [
          "QR və statistika hesabın aktiv olduğu müddətdə qalır. QR-i paneldən siləndə həmin kod və ona bağlı skan qeydləri silinir.",
          `Hesabın və Google-dan gələn profil məlumatının silinməsi üçün ${CONTACT} ünvanına e-poçt yaz. Sorğunu ağlabatan müddətdə icra edirik, qanun saxlamağı tələb etmədiyi halda.`,
        ],
      },
      {
        h: "Uşaqlar",
        body: [
          "Xidmət 13 yaşdan kiçik uşaqlar üçün nəzərdə tutulmayıb. Belə hesab aşkar etsək, silirik.",
        ],
      },
      {
        h: "Dəyişikliklər",
        body: [
          "Siyasət dəyişəndə bu səhifədəki tarix yenilənir. Xidməti istifadəyə davam etmək yenilənmiş mətni qəbul etmək deməkdir.",
        ],
      },
      {
        h: "Əlaqə",
        body: [`Sual və silmə sorğusu: ${CONTACT}`],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 8 أكتوبر 2026",
    intro:
      "Nibras QR (NibrasCode) أداة لإنشاء رموز QR ومسحها وتتبع الرموز الديناميكية. توضح هذه الصفحة البيانات التي نجمعها عند تسجيل الدخول بحساب Google وكيف نستخدمها.",
    sections: [
      {
        h: "من نحن",
        body: [
          "تدير NibrasCode هذه الخدمة. يُحفظ الحساب ومكتبة الرموز وإحصاءات المسح على خوادم التطبيق.",
        ],
      },
      {
        h: "تسجيل الدخول عبر Google",
        body: [
          "يُفتح الحساب عبر Google OAuth فقط. نستلم الاسم والبريد من Google. لا تُعرض صورة الملف.",
          "لا نستخدم بيانات Google للإعلانات أو البيع أو بناء ملفات خارج التطبيق. الاستخدام محدود بوظائف التطبيق الظاهرة (سياسة بيانات مستخدمي Google API، الاستخدام المحدود).",
          "تخضع بياناتك لدى Google لسياسة خصوصية Google. يمكنك إلغاء الإذن من إعدادات حساب Google.",
        ],
      },
      {
        h: "البيانات التي نجمعها",
        body: [
          "الحساب: الاسم والبريد ومعرّف داخلي. لا تُستخدم صورة الملف في الواجهة.",
          "رموز QR التي تنشئها: الاسم والنوع والمحتوى (رابط، واي فاي، جهة اتصال…) والتصميم والمجلد والحالة.",
          "مسح الرمز الديناميكي: الوقت ونوع الجهاز (هاتف، حاسوب، جهاز لوحي) والدولة التقريبية. لا نحفظ إحداثيات GPS ولا اسم الماسح.",
          "على جهازك فقط: اللغة وسجل الماسح. لا يُرسل هذا إلى الخادم.",
        ],
      },
      {
        h: "كيف نستخدم البيانات",
        body: [
          "فتح حسابك وعرض رموزك لك وحدك.",
          "توجيه الرمز الديناميكي إلى عنوان جديد دون تغيير الرمز المطبوع.",
          "تحويل عمليات المسح إلى عدد ورسم بياني وجهاز ودولة.",
          "حماية الخدمة والحد من إساءة الاستخدام والدعم.",
        ],
      },
      {
        h: "ما لا نفعله",
        body: [
          "لا نبيع البيانات الشخصية ولا نشاركها مع شبكات إعلانية.",
          "لا يُرسل محتوى الرموز أو الإحصاءات إلى أدوات تسويق خارجية.",
          "قد نكشف معلومات محدودة إذا طلب القانون ذلك أو لحماية الحقوق.",
        ],
      },
      {
        h: "التخزين والأمان",
        body: [
          "تُحفظ الجلسة في ملف تعريف ارتباط مشفّر. تُشفَّر رموز OAuth على الخادم.",
          "يتم النقل عبر HTTPS. لا يوجد نظام آمن تماماً؛ راجع نشاط تسجيل الدخول من حساب Google.",
        ],
      },
      {
        h: "المدة والحذف",
        body: [
          "تبقى الرموز والإحصاءات ما دام الحساب نشطاً. حذف رمز من اللوحة يحذف سجل المسح المرتبط به.",
          `لحذف الحساب وبيانات الملف القادمة من Google راسل ${CONTACT}. ننفّذ الطلب خلال مدة معقولة ما لم يلزم القانون الاحتفاظ بالبيانات.`,
        ],
      },
      {
        h: "الأطفال",
        body: ["الخدمة ليست موجّهة لمن هم دون 13 عاماً. إن اكتشفنا مثل هذا الحساب نحذفه."],
      },
      {
        h: "التغييرات",
        body: [
          "عند تغيير السياسة نحدّث التاريخ في هذه الصفحة. استمرار الاستخدام يعني قبول النص المحدّث.",
        ],
      },
      {
        h: "التواصل",
        body: [`للأسئلة وطلبات الحذف: ${CONTACT}`],
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Обновлено: 8 октября 2026",
    intro:
      "Nibras QR (NibrasCode) — инструмент для создания QR, сканирования и статистики динамических кодов. Здесь описано, какие данные мы получаем при входе через Google и как их используем.",
    sections: [
      {
        h: "Кто мы",
        body: [
          "Сервис ведёт NibrasCode. Аккаунт, библиотека QR и статистика сканов хранятся на серверах приложения.",
        ],
      },
      {
        h: "Вход через Google",
        body: [
          "Аккаунт создаётся только через Google OAuth. От Google мы получаем имя и адрес электронной почты. Фото профиля не показывается.",
          "Данные Google не используются для рекламы, продажи или профилей вне приложения. Использование ограничено функциями сервиса (Google API Services User Data Policy, Limited Use).",
          "Данные на стороне Google регулирует политика Google. Доступ можно отозвать в настройках аккаунта Google.",
        ],
      },
      {
        h: "Какие данные собираем",
        body: [
          "Аккаунт: имя, почта и внутренний идентификатор. Фото профиля в интерфейсе не используется.",
          "Созданные QR: название, тип, содержимое (ссылка, Wi-Fi, контакт и т.д.), дизайн, папка, статус.",
          "Скан динамического QR: время, тип устройства (телефон, компьютер, планшет) и приблизительная страна. Точные GPS-координаты и имя сканирующего не сохраняются.",
          "Только в браузере: язык и история сканера. На сервер это не отправляется.",
        ],
      },
      {
        h: "Как используем",
        body: [
          "Открыть аккаунт и показывать QR только вам.",
          "Перенаправлять динамический QR на новый адрес, не меняя напечатанный код.",
          "Считать сканы, строить график по дням, устройство и страну.",
          "Защищать сервис, снижать злоупотребления и отвечать на поддержку.",
        ],
      },
      {
        h: "Чего мы не делаем",
        body: [
          "Не продаём персональные данные и не отдаём их рекламным сетям.",
          "Содержимое QR и статистика не уходят во внешние маркетинговые инструменты.",
          "Ограниченное раскрытие возможно, если этого требует закон или защита прав.",
        ],
      },
      {
        h: "Хранение и безопасность",
        body: [
          "Сессия хранится в зашифрованной cookie. OAuth-токены шифруются на сервере.",
          "Передача идёт по HTTPS. Абсолютной защиты не существует; подозрительный вход проверяйте в аккаунте Google.",
        ],
      },
      {
        h: "Срок и удаление",
        body: [
          "QR и статистика хранятся, пока аккаунт активен. Удаление QR в панели удаляет и связанные сканы.",
          `Чтобы удалить аккаунт и данные профиля из Google, напишите на ${CONTACT}. Запрос выполняем в разумный срок, если закон не требует хранения.`,
        ],
      },
      {
        h: "Дети",
        body: [
          "Сервис не предназначен для детей младше 13 лет. Такой аккаунт удаляем, если обнаружим.",
        ],
      },
      {
        h: "Изменения",
        body: [
          "При изменении политики обновляется дата на этой странице. Продолжение использования означает принятие новой редакции.",
        ],
      },
      {
        h: "Контакт",
        body: [`Вопросы и запросы на удаление: ${CONTACT}`],
      },
    ],
  },
  tr: {
    title: "Gizlilik politikası",
    updated: "Güncelleme: 8 Ekim 2026",
    intro:
      "Nibras QR (NibrasCode), QR oluşturmak, taramak ve dinamik QR istatistiği tutmak içindir. Bu sayfa Google ile girişte hangi veriyi aldığımızı ve nasıl kullandığımızı açıklar.",
    sections: [
      {
        h: "Biz kimiz",
        body: [
          "Hizmeti NibrasCode işletir. Hesap, QR kitaplığı ve tarama istatistikleri uygulamanın sunucularında tutulur.",
        ],
      },
      {
        h: "Google ile giriş",
        body: [
          "Hesap yalnızca Google OAuth ile açılır. Google’dan ad ve e-posta alınır. Profil fotoğrafı gösterilmez.",
          "Google kullanıcı verisi reklam, satış veya uygulama dışı profil için kullanılmaz. Kullanım yalnızca uygulamanın gösterdiği işlevlerle sınırlıdır (Google API Services User Data Policy, Limited Use).",
          "Google tarafındaki veriler Google’ın gizlilik politikasına tabidir. İzni Google hesap ayarlarından kaldırabilirsiniz.",
        ],
      },
      {
        h: "Topladığımız veriler",
        body: [
          "Hesap: ad, e-posta ve dahili kimlik. Profil fotoğrafı arayüzde kullanılmaz.",
          "Oluşturduğunuz QR: ad, tür, içerik (bağlantı, Wi-Fi, kişi vb.), tasarım, klasör, durum.",
          "Dinamik QR taraması: zaman, cihaz türü (telefon, bilgisayar, tablet) ve yaklaşık ülke. Kesin GPS veya tarayanın adı saklanmaz.",
          "Yalnızca tarayıcıda: dil ve tarayıcı geçmişi. Sunucuya gönderilmez.",
        ],
      },
      {
        h: "Veriyi nasıl kullanırız",
        body: [
          "Hesabınızı açmak ve QR’larınızı yalnızca size göstermek.",
          "Basılı kodu değiştirmeden dinamik QR’ı yeni adrese yönlendirmek.",
          "Taramaları sayıya, gün grafiğine, cihaz ve ülkeye çevirmek.",
          "Hizmeti korumak, kötüye kullanımı azaltmak ve destek vermek.",
        ],
      },
      {
        h: "Yapmadıklarımız",
        body: [
          "Kişisel veriyi satmayız ve reklam ağlarına vermeyiz.",
          "QR içeriği ve istatistik üçüncü taraf pazarlama araçlarına gitmez.",
          "Yasa gerektirirse veya hakları korumak için sınırlı açıklama olabilir.",
        ],
      },
      {
        h: "Saklama ve güvenlik",
        body: [
          "Oturum şifreli çerezde tutulur. OAuth belirteçleri sunucuda şifrelenir.",
          "Aktarım HTTPS üzerindedir. Hiçbir sistem tam güvenli değildir; şüpheli girişi Google hesabınızdan kontrol edin.",
        ],
      },
      {
        h: "Süre ve silme",
        body: [
          "QR ve istatistik hesap açıkken durur. Panelden QR silmek, bağlı tarama kayıtlarını da siler.",
          `Hesabı ve Google’dan gelen profil verisini silmek için ${CONTACT} adresine yazın. Yasa saklamayı zorunlu kılmadıkça talebi makul sürede yerine getiririz.`,
        ],
      },
      {
        h: "Çocuklar",
        body: [
          "Hizmet 13 yaşından küçükler için değildir. Böyle bir hesap görürsek sileriz.",
        ],
      },
      {
        h: "Değişiklikler",
        body: [
          "Politika değişince bu sayfadaki tarih güncellenir. Kullanıma devam etmek güncel metni kabul etmek demektir.",
        ],
      },
      {
        h: "İletişim",
        body: [`Sorular ve silme talepleri: ${CONTACT}`],
      },
    ],
  },
};
