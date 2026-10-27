/* Lazurde Resort · web de reservas
 * Todo lo que el cliente ve y las reglas de precio están en este archivo.
 * Para cambiar precios, fechas o reglas, edita el bloque CONFIG.
 */
(function () {
  'use strict';

  // ===================== CONFIG =====================
  var CONFIG = {
    // Precios FINALES que ve el cliente, con impuesto de turismo e IVA ya incluidos
    weekdayPrice: 240,   // sábado a miércoles (antes 220 + impuestos)
    weekendPrice: 285,   // noches de jueves y viernes (antes 260 + impuestos)
    holidayPrice: 285,   // feriados
    extraRoomPrice: 15,  // por habitación extra y por noche, impuestos incluidos
    tourismTax: 4,       // %
    vat: 5,              // %
    deposit: 100,        // depósito de garantía, se paga al llegar
    baseGuests: 6,
    baseRooms: 3,
    maxGuests: 14,
    maxKing: 3,          // habitaciones con cama king
    maxTwin: 4,          // habitaciones con 2 camas individuales
    weekendDays: [4, 5], // 4 = jueves, 5 = viernes (noche que se cobra)
    // Feriados oficiales (fecha de la noche que se cobra con precio de feriado)
    holidays: ['2026-11-25', '2026-11-26'],
    // Noches ocupadas: EJEMPLO para la vista previa. Luego vendrán de la base de datos.
    booked: ['2026-11-06', '2026-11-07', '2026-11-13', '2026-11-19', '2026-11-20', '2026-11-27', '2026-11-28'],
    monthsAhead: 12
  };

  // ===================== TEXTOS (3 idiomas) =====================
  function arNights(n) { return n === 1 ? 'ليلة واحدة' : (n === 2 ? 'ليلتان' : (n <= 10 ? n + ' ليالٍ' : n + ' ليلة')); }
  function arGuests(n) { return n + (n <= 10 ? ' ضيوف' : ' ضيفًا'); }

  var DICT = {
    es: {
      unit: ' OMR', sep: ', ',
      months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      wd: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      fmt: function (w, d, m) { return ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][w] + ' ' + d + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m]; },
      changeLang: 'Cambiar idioma', waAria: 'Escribir por WhatsApp', prevPhoto: 'Foto anterior', nextPhoto: 'Foto siguiente', fav: 'Guardar en favoritos', share: 'Compartir',
      gal: ['Video · Vista general', 'Piscina', 'Habitación con cama king', 'Habitación con 2 camas', 'Zona de parrilla'],
      of: function (i, n) { return i + ' de ' + n; },
      resortName: 'Lazurde Resort', badge: 'Resort privado', location: '[Ubicación], Omán',
      specs: ['7 habitaciones', '14 camas', '10 baños', 'Piscina', 'Parqueadero'],
      license: 'Licencia de turismo N.º [pendiente]', whatsapp: 'WhatsApp', call: 'Llamar',
      availability: 'Disponibilidad', availSub: 'Precio por noche para 6 personas, impuestos incluidos.',
      prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
      lgWeekday: 'Entre semana', lgWeekend: 'Jue y vie', lgHoliday: 'Feriado', lgBooked: 'Ocupado',
      toChoose: 'Para elegir tus fechas toca «Reservar».',
      booked: 'Ocupado', cin: 'Llega', cout: 'Sale', outOnly: 'Solo salida',
      times: 'Horarios', checkIn: 'Check-in', checkOut: 'Check-out', checkInTime: '2:00 pm', checkOutTime: '11:00 am', inShort: '2:00 pm', outShort: '11:00 am',
      rooms: 'Habitaciones', kingRooms: '3 habitaciones · 1 cama king', kingRoomsSub: 'Cama matrimonial grande', twinRooms: '4 habitaciones · 2 camas individuales', twinRoomsSub: 'Dos camas separadas',
      extraRoom: 'Habitación extra', perNightShort: ' / noche',
      facilities: 'Instalaciones',
      fac: ['Piscina', 'Cancha de fútbol', 'Zona de billar', 'Parqueadero', 'Zona de parrilla (BBQ)', 'Área para niños', 'Parque de juegos', 'Mini zoo: pavos reales, aves, conejos y cabras', 'Wood House (zona de relajación)', 'Fuentes', 'Zonas de descanso', 'Jardines'],
      showAll: function (n) { return 'Ver todas (' + n + ')'; }, showLess: 'Ver menos',
      where: 'Dónde estarás', whereNote: 'La ubicación exacta se envía cuando se confirma la reserva.',
      deposit: 'Depósito de garantía', depositAmount: 'Monto del depósito', depositNote: 'Se paga al llegar y se devuelve dentro de las 24 horas posteriores a la salida, después de revisar el resort.',
      allowedEvents: 'Eventos permitidos', eventsNote: 'Todo evento necesita autorización previa de Lazurde. Después de reservar, coordínalo con nosotros por WhatsApp.',
      events: ['Familia', 'Familia grande', 'Reunión de hombres', 'Reunión de mujeres', 'Parejas', 'Cumpleaños', 'Boda', 'Reunión de trabajo', 'Otro'],
      policies: 'Políticas', cancellation: 'Cancelación', dateChange: 'Cambio de fecha', tbd: '[Por definir con Salim]',
      terms: 'Términos y condiciones', termLine: function (i) { return i + '. [Término ' + i + ' — texto pendiente. Aquí van los términos y condiciones oficiales de Lazurde Resort.]'; },
      showMore: 'Ver más', footer: 'Lazurde Resort · Omán',
      from: 'Desde', perNight: '/ noche', baseInfo: '6 personas · 3 habitaciones', bookNow: 'Reservar',
      navAria: 'Navegación principal', navHome: 'Inicio', navCal: 'Calendario', navMine: 'Mis reservas', navContact: 'Contacto',
      back: 'Volver', confirmTitle: 'Confirmar reserva', summarySub: 'Resort privado · [Ubicación], Omán',
      dates: 'Fechas', choose: 'Elegir', clearDates: 'Borrar fechas', noDates: 'Sin fechas',
      nightsTxt: function (n) { return n + (n === 1 ? ' noche' : ' noches'); },
      hintIn: 'Toca el día de llegada y luego el de salida. Ej.: llegar el 3 y salir el 4 = 1 noche.',
      hintOut: 'Ahora toca el día de salida.',
      guests: 'Personas', guestsRange: 'Mínimo 6 · máximo 14', autoRooms: 'Se asignan automáticamente',
      extraNotice: function (p) { return 'Cada habitación extra tiene un costo de ' + p + ' por noche.'; },
      minusGuest: 'Quitar una persona', plusGuest: 'Agregar una persona',
      confirmBtn: function (n) { return 'Confirmar ' + n + ' personas'; },
      confirmedTxt: function (n, r) { return n + ' personas · ' + r + ' habitaciones confirmadas'; },
      beds: '¿Cómo quieren las camas?', bedsLocked: 'Primero confirma el número de personas.',
      kingBed: '1 cama king', kingBedSub: 'Matrimonial · máx. 3', twinBed: '2 camas individuales', twinBedSub: 'Separadas · máx. 4',
      kingMinusAria: 'Una habitación king menos', kingPlusAria: 'Una habitación king más', twinMinusAria: 'Una habitación de 2 camas menos', twinPlusAria: 'Una habitación de 2 camas más',
      assigned: 'Habitaciones asignadas', ofWord: ' de ',
      purpose: 'Motivo de la reserva', optional: '(opcional)',
      details: 'Tus datos', fullName: 'Nombre completo', namePh: 'Ej.: Ahmed Al Balushi', phone: 'Teléfono (WhatsApp)', email: 'Correo electrónico',
      priceDetails: 'Detalle del precio', night: 'Noche', price: 'Precio', holidayTag: ' · feriado', weekendTag: ' · fin de semana',
      stayLine: function (n) { return 'Alojamiento (' + n + (n === 1 ? ' noche)' : ' noches)'); },
      extraLine: function (e, n) { return e + (e === 1 ? ' habitación extra' : ' habitaciones extra') + ' × ' + n + (n === 1 ? ' noche' : ' noches'); },
      taxLine: function (p) { return 'Impuesto de turismo (' + p + '%)'; }, vatLine: function (p) { return 'IVA (' + p + '%)'; },
      totalLabel: 'Total (OMR)', inclTaxes: 'Ya incluido en el precio:', pickToSee: 'Elige tus fechas para ver el precio.',
      depositBook: function (d) { return 'Depósito de garantía de ' + d + ': se paga al llegar y se devuelve dentro de 24 horas después de la salida. No está incluido en el total.'; },
      accept: 'He leído y acepto los términos y condiciones de Lazurde Resort.',
      missing: 'Falta: ', mDates: 'fechas', mGuests: 'confirmar personas', mName: 'nombre', mPhone: 'teléfono', mTerms: 'aceptar los términos',
      barSub: function (n, r) { return n + (n === 1 ? ' noche' : ' noches') + ' · ' + r + ' habitaciones'; }, pickDates: 'Elige tus fechas',
      sending: 'Enviando…',
      sentTitle: '¡Solicitud enviada!', sentText: 'Te enviamos los detalles por WhatsApp y correo. Te avisaremos cuando la reserva quede confirmada.',
      code: 'Código de reserva', example: ' (ejemplo)',
      rIn: 'Llegada', rOut: 'Salida', rGuests: 'Personas', rRooms: 'Habitaciones', rPurpose: 'Motivo', rTotal: 'Total',
      guestsTxt: function (n) { return n + ' personas'; }, roomsTxt: function (r, k, t) { return r + ' (' + k + ' king · ' + t + ' de 2 camas)'; }, notGiven: 'No indicado',
      remember: 'Recuerda', remIn: 'Check-in: 2:00 pm', remOut: 'Check-out: 11:00 am', areasTitle: 'Conoce el resort', areasSub: 'Desliza para ver cada zona.', areas: ['Piscina', 'Zona de parrilla (BBQ)', 'Wood House', 'Mini zoo', 'Cancha de fútbol', 'Zona de billar', 'Área para niños', 'Jardines y fuentes'],
      depositRem: function (d) { return 'Depósito de garantía: ' + d + ', se paga al llegar.'; }, backHome: 'Volver al inicio',
      ariaCell: function (d, mo, booked, price, isIn, isOut) { return d + ' de ' + mo + (booked ? ', ocupado' : ', ' + price + ' OMR por noche') + (isIn ? ', llegada' : '') + (isOut ? ', salida' : ''); }
    },
    en: {
      unit: ' OMR', sep: ', ',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      wd: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      fmt: function (w, d, m) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w] + ', ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] + ' ' + d; },
      changeLang: 'Change language', waAria: 'Message us on WhatsApp', prevPhoto: 'Previous photo', nextPhoto: 'Next photo', fav: 'Save to favorites', share: 'Share',
      gal: ['Video · Overview', 'Swimming pool', 'King bed bedroom', 'Twin bedroom', 'BBQ area'],
      of: function (i, n) { return i + ' of ' + n; },
      resortName: 'Lazurde Resort', badge: 'Private resort', location: '[Location], Oman',
      specs: ['7 bedrooms', '14 beds', '10 bathrooms', 'Pool', 'Parking'],
      license: 'Tourism license No. [pending]', whatsapp: 'WhatsApp', call: 'Call',
      availability: 'Availability', availSub: 'Nightly price for 6 guests, taxes included.',
      prevMonth: 'Previous month', nextMonth: 'Next month',
      lgWeekday: 'Weekday', lgWeekend: 'Thu & Fri', lgHoliday: 'Public holiday', lgBooked: 'Booked',
      toChoose: 'To choose your dates, tap “Book now”.',
      booked: 'Booked', cin: 'In', cout: 'Out', outOnly: 'Check-out only',
      times: 'Check-in & check-out', checkIn: 'Check-in', checkOut: 'Check-out', checkInTime: '2:00 pm', checkOutTime: '11:00 am', inShort: '2:00 pm', outShort: '11:00 am',
      rooms: 'Bedrooms', kingRooms: '3 bedrooms · 1 king bed', kingRoomsSub: 'Large double bed', twinRooms: '4 bedrooms · 2 twin beds', twinRoomsSub: 'Two separate beds',
      extraRoom: 'Extra bedroom', perNightShort: ' / night',
      facilities: 'Facilities',
      fac: ['Swimming pool', 'Football field', 'Billiards area', 'Parking', 'BBQ area', 'Kids area', 'Playground', 'Mini zoo: peacocks, birds, rabbits & goats', 'Wood House (relaxation area)', 'Fountains', 'Outdoor seating', 'Gardens'],
      showAll: function (n) { return 'Show all (' + n + ')'; }, showLess: 'Show less',
      where: 'Where you’ll be', whereNote: 'The exact location is shared once your booking is confirmed.',
      deposit: 'Security deposit', depositAmount: 'Deposit amount', depositNote: 'Paid on arrival and refunded within 24 hours after check-out, once the resort has been inspected.',
      allowedEvents: 'Allowed events', eventsNote: 'All events need prior approval from Lazurde. After booking, please arrange it with us on WhatsApp.',
      events: ['Family', 'Large family', 'Men’s gathering', 'Women’s gathering', 'Couples', 'Birthday party', 'Wedding', 'Team gathering', 'Other'],
      policies: 'Policies', cancellation: 'Cancellation', dateChange: 'Date change', tbd: '[To be confirmed]',
      terms: 'Terms & conditions', termLine: function (i) { return i + '. [Term ' + i + ' — pending text. The official Lazurde Resort terms & conditions go here.]'; },
      showMore: 'Show more', footer: 'Lazurde Resort · Oman',
      from: 'From', perNight: '/ night', baseInfo: '6 guests · 3 bedrooms', bookNow: 'Book now',
      navAria: 'Main navigation', navHome: 'Home', navCal: 'Calendar', navMine: 'My bookings', navContact: 'Contact',
      back: 'Back', confirmTitle: 'Confirm booking', summarySub: 'Private resort · [Location], Oman',
      dates: 'Dates', choose: 'Select', clearDates: 'Clear dates', noDates: 'No dates yet',
      nightsTxt: function (n) { return n + (n === 1 ? ' night' : ' nights'); },
      hintIn: 'Tap your check-in day, then your check-out day. E.g. arrive on the 3rd and leave on the 4th = 1 night.',
      hintOut: 'Now tap your check-out day.',
      guests: 'Guests', guestsRange: 'Minimum 6 · maximum 14', autoRooms: 'Assigned automatically',
      extraNotice: function (p) { return 'Each extra bedroom costs ' + p + ' per night.'; },
      minusGuest: 'Remove a guest', plusGuest: 'Add a guest',
      confirmBtn: function (n) { return 'Confirm ' + n + ' guests'; },
      confirmedTxt: function (n, r) { return n + ' guests · ' + r + ' bedrooms confirmed'; },
      beds: 'Choose your beds', bedsLocked: 'Confirm the number of guests first.',
      kingBed: '1 king bed', kingBedSub: 'Double · max. 3', twinBed: '2 twin beds', twinBedSub: 'Separate · max. 4',
      kingMinusAria: 'One king bedroom less', kingPlusAria: 'One king bedroom more', twinMinusAria: 'One twin bedroom less', twinPlusAria: 'One twin bedroom more',
      assigned: 'Bedrooms assigned', ofWord: ' of ',
      purpose: 'Purpose of stay', optional: '(optional)',
      details: 'Your details', fullName: 'Full name', namePh: 'e.g. Ahmed Al Balushi', phone: 'Phone (WhatsApp)', email: 'Email',
      priceDetails: 'Price details', night: 'Night', price: 'Price', holidayTag: ' · holiday', weekendTag: ' · weekend',
      stayLine: function (n) { return 'Stay (' + n + (n === 1 ? ' night)' : ' nights)'); },
      extraLine: function (e, n) { return e + (e === 1 ? ' extra bedroom' : ' extra bedrooms') + ' × ' + n + (n === 1 ? ' night' : ' nights'); },
      taxLine: function (p) { return 'Tourism tax (' + p + '%)'; }, vatLine: function (p) { return 'VAT (' + p + '%)'; },
      totalLabel: 'Total (OMR)', inclTaxes: 'Already included in the price:', pickToSee: 'Choose your dates to see the price.',
      depositBook: function (d) { return 'Security deposit of ' + d + ': paid on arrival and refunded within 24 hours after check-out. Not included in the total.'; },
      accept: 'I have read and accept the Lazurde Resort terms & conditions.',
      missing: 'Missing: ', mDates: 'dates', mGuests: 'confirm guests', mName: 'name', mPhone: 'phone', mTerms: 'accept the terms',
      barSub: function (n, r) { return n + (n === 1 ? ' night' : ' nights') + ' · ' + r + ' bedrooms'; }, pickDates: 'Choose your dates',
      sending: 'Sending…',
      sentTitle: 'Request sent!', sentText: 'We’ve sent the details by WhatsApp and email. We’ll let you know as soon as your booking is confirmed.',
      code: 'Booking code', example: ' (example)',
      rIn: 'Check-in', rOut: 'Check-out', rGuests: 'Guests', rRooms: 'Bedrooms', rPurpose: 'Purpose', rTotal: 'Total',
      guestsTxt: function (n) { return n + ' guests'; }, roomsTxt: function (r, k, t) { return r + ' (' + k + ' king · ' + t + ' twin)'; }, notGiven: 'Not specified',
      remember: 'Please note', remIn: 'Check-in: 2:00 pm', remOut: 'Check-out: 11:00 am', areasTitle: 'Explore the resort', areasSub: 'Swipe to see each area.', areas: ['Swimming pool', 'BBQ area', 'Wood House', 'Mini zoo', 'Football field', 'Billiards area', 'Kids area', 'Gardens & fountains'],
      depositRem: function (d) { return 'Security deposit: ' + d + ', paid on arrival.'; }, backHome: 'Back to home',
      ariaCell: function (d, mo, booked, price, isIn, isOut) { return mo + ' ' + d + (booked ? ', booked' : ', ' + price + ' OMR per night') + (isIn ? ', check-in' : '') + (isOut ? ', check-out' : ''); }
    },
    ar: {
      unit: ' ر.ع.', sep: '، ',
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      wd: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
      fmt: function (w, d, m) { return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][w] + ' ' + d + ' ' + ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][m]; },
      changeLang: 'تغيير اللغة', waAria: 'راسلنا عبر واتساب', prevPhoto: 'الصورة السابقة', nextPhoto: 'الصورة التالية', fav: 'حفظ في المفضلة', share: 'مشاركة',
      gal: ['فيديو · نظرة عامة', 'المسبح', 'غرفة بسرير كينغ', 'غرفة بسريرين', 'منطقة الشواء'],
      of: function (i, n) { return i + ' من ' + n; },
      resortName: 'منتجع لازورد', badge: 'منتجع خاص', location: '[الموقع]، عُمان',
      specs: ['7 غرف نوم', '14 سريرًا', '10 حمامات', 'مسبح', 'موقف سيارات'],
      license: 'رقم الترخيص السياحي [قيد الإضافة]', whatsapp: 'واتساب', call: 'اتصال',
      availability: 'التوفر', availSub: 'سعر الليلة لـ 6 ضيوف شامل الضرائب.',
      prevMonth: 'الشهر السابق', nextMonth: 'الشهر التالي',
      lgWeekday: 'أيام الأسبوع', lgWeekend: 'الخميس والجمعة', lgHoliday: 'عطلة رسمية', lgBooked: 'محجوز',
      toChoose: 'لاختيار التواريخ اضغط «احجز الآن».',
      booked: 'محجوز', cin: 'وصول', cout: 'مغادرة', outOnly: 'مغادرة فقط',
      times: 'مواعيد الوصول والمغادرة', checkIn: 'الوصول', checkOut: 'المغادرة', checkInTime: '2:00 مساءً', checkOutTime: '11:00 صباحًا', inShort: '2:00 م', outShort: '11:00 ص',
      rooms: 'الغرف', kingRooms: '3 غرف · سرير كينغ', kingRoomsSub: 'سرير مزدوج كبير', twinRooms: '4 غرف · سريران منفردان', twinRoomsSub: 'سريران منفصلان',
      extraRoom: 'غرفة إضافية', perNightShort: ' / الليلة',
      facilities: 'المرافق',
      fac: ['مسبح', 'ملعب كرة قدم', 'منطقة البلياردو', 'موقف سيارات', 'منطقة شواء', 'منطقة أطفال', 'ملعب أطفال', 'حديقة حيوانات صغيرة: طواويس وطيور وأرانب وماعز', 'البيت الخشبي (منطقة استرخاء)', 'نوافير', 'جلسات خارجية', 'حدائق'],
      showAll: function (n) { return 'عرض الكل (' + n + ')'; }, showLess: 'عرض أقل',
      where: 'أين ستقيم', whereNote: 'نرسل الموقع الدقيق بعد تأكيد الحجز.',
      deposit: 'مبلغ التأمين', depositAmount: 'قيمة التأمين', depositNote: 'يُدفع عند الوصول ويُسترد خلال 24 ساعة بعد المغادرة، بعد معاينة المنتجع.',
      allowedEvents: 'المناسبات المسموح بها',
      eventsNote: 'جميع المناسبات تحتاج إلى موافقة مسبقة من لازورد. بعد الحجز، يرجى التنسيق معنا عبر واتساب.', events: ['عائلة', 'عائلة كبيرة', 'تجمع رجال', 'تجمع نساء', 'أزواج', 'حفلة عيد ميلاد', 'حفل زفاف', 'تجمع عمل', 'أخرى'],
      policies: 'السياسات', cancellation: 'الإلغاء', dateChange: 'تغيير التاريخ', tbd: '[سيتم تأكيده]',
      terms: 'الشروط والأحكام', termLine: function (i) { return i + '. [البند ' + i + ' — نص قيد الإعداد. هنا تُضاف الشروط والأحكام الرسمية لمنتجع لازورد.]'; },
      showMore: 'عرض المزيد', footer: 'منتجع لازورد · عُمان',
      from: 'ابتداءً من', perNight: '/ الليلة', baseInfo: '6 ضيوف · 3 غرف', bookNow: 'احجز الآن',
      navAria: 'التنقل الرئيسي', navHome: 'الرئيسية', navCal: 'التقويم', navMine: 'حجوزاتي', navContact: 'تواصل',
      back: 'رجوع', confirmTitle: 'تأكيد الحجز', summarySub: 'منتجع خاص · [الموقع]، عُمان',
      dates: 'التواريخ', choose: 'اختر', clearDates: 'مسح التواريخ', noDates: 'لم تُحدَّد التواريخ',
      nightsTxt: arNights,
      hintIn: 'اضغط على يوم الوصول ثم يوم المغادرة. مثال: الوصول يوم 3 والمغادرة يوم 4 = ليلة واحدة.',
      hintOut: 'اضغط الآن على يوم المغادرة.',
      guests: 'الضيوف', guestsRange: 'الحد الأدنى 6 · الحد الأقصى 14', autoRooms: 'تُحدَّد تلقائيًا',
      extraNotice: function (p) { return 'تكلفة كل غرفة إضافية ' + p + ' في الليلة.'; },
      minusGuest: 'إزالة ضيف', plusGuest: 'إضافة ضيف',
      confirmBtn: function (n) { return 'تأكيد ' + arGuests(n); },
      confirmedTxt: function (n, r) { return 'تم تأكيد ' + arGuests(n) + ' · ' + r + ' غرف'; },
      beds: 'اختر الأسرّة', bedsLocked: 'أكّد عدد الضيوف أولًا.',
      kingBed: 'سرير كينغ', kingBedSub: 'مزدوج · بحد أقصى 3', twinBed: 'سريران منفردان', twinBedSub: 'منفصلان · بحد أقصى 4',
      kingMinusAria: 'غرفة كينغ أقل', kingPlusAria: 'غرفة كينغ أكثر', twinMinusAria: 'غرفة بسريرين أقل', twinPlusAria: 'غرفة بسريرين أكثر',
      assigned: 'الغرف المخصصة', ofWord: ' من ',
      purpose: 'سبب الحجز', optional: '(اختياري)',
      details: 'بياناتك', fullName: 'الاسم الكامل', namePh: 'مثال: أحمد البلوشي', phone: 'الهاتف (واتساب)', email: 'البريد الإلكتروني',
      priceDetails: 'تفاصيل السعر', night: 'الليلة', price: 'السعر', holidayTag: ' · عطلة', weekendTag: ' · نهاية الأسبوع',
      stayLine: function (n) { return 'الإقامة (' + arNights(n) + ')'; },
      extraLine: function (e, n) { return 'غرف إضافية (' + e + ') × ' + arNights(n); },
      taxLine: function (p) { return 'ضريبة السياحة (' + p + '%)'; }, vatLine: function (p) { return 'ضريبة القيمة المضافة (' + p + '%)'; },
      totalLabel: 'الإجمالي (ر.ع.)', inclTaxes: 'مشمول في السعر:', pickToSee: 'اختر التواريخ لعرض السعر.',
      depositBook: function (d) { return 'مبلغ تأمين ' + d + ': يُدفع عند الوصول ويُسترد خلال 24 ساعة بعد المغادرة، وهو غير مشمول في الإجمالي.'; },
      accept: 'قرأت الشروط والأحكام الخاصة بمنتجع لازورد وأوافق عليها.',
      missing: 'ينقص: ', mDates: 'التواريخ', mGuests: 'تأكيد عدد الضيوف', mName: 'الاسم', mPhone: 'الهاتف', mTerms: 'الموافقة على الشروط',
      barSub: function (n, r) { return arNights(n) + ' · ' + r + ' غرف'; }, pickDates: 'اختر التواريخ',
      sending: 'جارٍ الإرسال…',
      sentTitle: 'تم إرسال طلبك!', sentText: 'أرسلنا التفاصيل عبر واتساب والبريد الإلكتروني، وسنبلغك فور تأكيد الحجز.',
      code: 'رمز الحجز', example: ' (مثال)',
      rIn: 'الوصول', rOut: 'المغادرة', rGuests: 'الضيوف', rRooms: 'الغرف', rPurpose: 'السبب', rTotal: 'الإجمالي',
      guestsTxt: arGuests, roomsTxt: function (r, k, t) { return r + ' (' + k + ' كينغ · ' + t + ' بسريرين)'; }, notGiven: 'غير محدد',
      remember: 'تذكير', remIn: 'الوصول: 2:00 م', remOut: 'المغادرة: 11:00 ص', areasTitle: 'تعرّف على المنتجع', areasSub: 'اسحب لمشاهدة كل منطقة.', areas: ['المسبح', 'منطقة الشواء', 'البيت الخشبي', 'حديقة الحيوانات الصغيرة', 'ملعب كرة القدم', 'منطقة البلياردو', 'منطقة الأطفال', 'الحدائق والنوافير'],
      depositRem: function (d) { return 'مبلغ التأمين: ' + d + '، يُدفع عند الوصول.'; }, backHome: 'العودة إلى الرئيسية',
      ariaCell: function (d, mo, booked, price, isIn, isOut) { return d + ' ' + mo + (booked ? '، محجوز' : '، ' + price + ' ر.ع. في الليلة') + (isIn ? '، الوصول' : '') + (isOut ? '، المغادرة' : ''); }
    }
  };

  // ===================== ÍCONOS =====================
  var ICON = {
    globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
    chat: 'M4 5h16v11H9l-5 4z',
    chatDots: 'M4 5h16v11H9l-5 4z M8 10h.01 M12 10h.01 M16 10h.01',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
    pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z M12 7a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
    heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
    share: 'M18 4a2 2 0 1 0 0 4a2 2 0 1 0 0-4 M6 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4 M18 16a2 2 0 1 0 0 4a2 2 0 1 0 0-4 M8 11l8-4 M8 13l8 4',
    left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6',
    backL: 'M19 12H5 M11 6l-6 6 6 6', backR: 'M5 12h14 M13 6l6 6-6 6',
    clockIn: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v5l3 2', clockOut: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v5l-3 2',
    people: 'M9 11a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6 M16 11a2.5 2.5 0 1 0 0-5 M17 14c2.5.4 4 2.6 4 5.5',
    lock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
    info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 11v6 M12 7.5v.5',
    check: 'M5 12l5 5 9-10',
    home: 'M3 11l9-7 9 7 M5 10v10h5v-6h4v6h5V10', cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4', list: 'M5 4h14v16H5z M8 9h8 M8 13h8 M8 17h5',
    king: 'M3 20v-7a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v7 M3 17h26 M3 20v2 M29 20v2 M6 11V7a1.5 1.5 0 0 1 1.5-1.5h17A1.5 1.5 0 0 1 26 7v4 M9 11V9h6v2 M17 11V9h6v2',
    twin: 'M2 20v-6a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 14v6 M2 17.5h12 M2 20v2 M14 20v2 M4 12.5V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3.5 M18 20v-6a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 30 14v6 M18 17.5h12 M18 20v2 M30 20v2 M20 12.5V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3.5'
  };
  var FAC_ICONS = [
    'M2 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0 M2 14c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0 M8 12V5a2 2 0 0 1 4 0 M16 12V5a2 2 0 0 0-4 0 M8 8h8',
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7l3.5 2.5-1.3 4h-4.4l-1.3-4z M12 7V3.5 M15.5 9.5l3.8-1.2 M14.2 13.5l2.3 3.2 M9.8 13.5l-2.3 3.2 M8.5 9.5L4.7 8.3',
    'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16 M12 8.5a2 2 0 1 0 0 4a2 2 0 1 0 0-4 M12 12.5a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6',
    'M4 3h16v18H4z M9 17V7h4a3 3 0 0 1 0 6H9',
    'M4 10h16 M5 10a7 7 0 0 0 14 0 M8 17l-2 4 M16 17l2 4 M12 17v4 M9 3c0 1 1 1 1 2s-1 1-1 2 M13 3c0 1 1 1 1 2s-1 1-1 2',
    'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M12 8v6 M8 10l4 2 4-2 M9 21l3-7 3 7',
    'M3 21V8l4-4 4 4v13 M7 21v-6 M11 12l9 9 M3 13h8',
    'M12 14c-3 0-5 2.5-5 4.5 0 1.5 1.5 2 3 1.5 1-.3 2-.3 4 0 1.5.5 3 0 3-1.5 0-2-2-4.5-5-4.5Z M5.5 10.5a1.5 2 0 1 0 3 0a1.5 2 0 1 0-3 0 M9.5 6.5a1.5 2 0 1 0 3 0a1.5 2 0 1 0-3 0 M13.5 6.5a1.5 2 0 1 0 3 0a1.5 2 0 1 0-3 0 M15.5 10.5a1.5 2 0 1 0 3 0a1.5 2 0 1 0-3 0',
    'M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6',
    'M12 3v9 M12 6c-3 0-5 2-5 4 M12 6c3 0 5 2 5 4 M4 14h16 M6 14v3a6 3 0 0 0 12 0v-3 M9 21h6',
    'M4 12h16 M5 12V9h14v3 M6 12v6 M18 12v6 M4 15h16',
    'M12 22V12 M12 12c-4 0-7-3-7-7 4 0 7 3 7 7Z M12 14c3 0 6-2 6-6-3 0-6 2-6 6Z'
  ];
  var AREA_IMG = ['', '', '', '', '', '', '', ''];  // aquí van las fotos de cada zona (img/areas/...)
  var AREA_BG = ['linear-gradient(170deg,#0F4C81,#5FA8D9)', 'linear-gradient(170deg,#3A2A1A,#B4762E)', 'linear-gradient(170deg,#4A3420,#9A7A4F)', 'linear-gradient(170deg,#2F4A26,#8DB36F)', 'linear-gradient(170deg,#1E5130,#6FBF73)', 'linear-gradient(170deg,#1B2B3A,#3E6A8A)', 'linear-gradient(170deg,#5A4520,#D3AE2A)', 'linear-gradient(170deg,#24453A,#7FB59A)'];
  var GAL_BG = ['linear-gradient(160deg,#0B2E4F,#1F6FB2)', 'linear-gradient(160deg,#155E9E,#7FB8E6)', 'linear-gradient(160deg,#5A4520,#D3AE2A)', 'linear-gradient(160deg,#2C3E50,#5D7A96)', 'linear-gradient(160deg,#3B5A2E,#8DB36F)'];

  function svg(d, opts) {
    opts = opts || {};
    var w = opts.w || 22, h = opts.h || w, vb = opts.vb || '0 0 24 24';
    return '<svg width="' + w + '" height="' + h + '" viewBox="' + vb + '" fill="' + (opts.fill || 'none') + '" stroke="' + (opts.stroke || 'currentColor') +
      '" stroke-width="' + (opts.sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (opts.style ? ' style="' + opts.style + '"' : '') + '><path d="' + d + '"></path></svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // ===================== FECHAS =====================
  function pad(n) { return String(n).padStart(2, '0'); }
  function keyOf(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function addDays(k, n) {
    var p = k.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
    return keyOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  function dow(k) { var p = k.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  function isBooked(k) { return CONFIG.booked.indexOf(k) >= 0; }
  function isHoliday(k) { return CONFIG.holidays.indexOf(k) >= 0; }
  function isWeekendNight(k) { return CONFIG.weekendDays.indexOf(dow(k)) >= 0; }
  function nightPrice(k) {
    if (isHoliday(k)) return CONFIG.holidayPrice;
    return isWeekendNight(k) ? CONFIG.weekendPrice : CONFIG.weekdayPrice;
  }
  // Los precios de CONFIG ya son finales (impuestos incluidos); los impuestos se calculan por dentro
  function incl(n) { return n; }
  function rangeOk(a, b) {
    for (var k = a; k < b; k = addDays(k, 1)) { if (isBooked(k)) return false; }
    return true;
  }
  function roomsFor(g) { return CONFIG.baseRooms + Math.max(0, Math.ceil((g - CONFIG.baseGuests) / 2)); }

  // ===================== ESTADO =====================
  var state = {
    screen: 'lang', lang: 'es', month: 0, gIdx: 0, liked: false, showAllFac: false, termsOpen: false,
    checkin: null, checkout: null, guests: CONFIG.baseGuests, confirmed: false, kings: CONFIG.maxKing,
    event: null, name: '', phone: '', email: '', termsOk: false, submitting: false
  };
  function set(patch) {
    var prevScreen = state.screen;
    for (var k in patch) state[k] = patch[k];
    render();
    if (patch.screen && patch.screen !== prevScreen) window.scrollTo(0, 0);
  }

  // ===================== CÁLCULOS =====================
  function calc() {
    var L = state.lang, T = DICT[L], rtl = L === 'ar';
    var money = function (n) { var r = Math.round(n * 100) / 100; return (r % 1 ? r.toFixed(2) : String(r)) + T.unit; };
    var whole = function (n) { return n + T.unit; };
    var fmt = function (k) { if (!k) return T.choose; var p = k.split('-').map(Number); return T.fmt(dow(k), p[2], p[1] - 1); };
    var t0 = new Date();
    var todayKey = keyOf(t0.getFullYear(), t0.getMonth(), t0.getDate());
    var base = new Date(Date.UTC(t0.getFullYear(), t0.getMonth() + state.month, 1));
    var y = base.getUTCFullYear(), m = base.getUTCMonth(), first = base.getUTCDay();
    var dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    var nightRows = [], roomTotal = 0;
    if (state.checkin && state.checkout) {
      for (var k = state.checkin; k < state.checkout; k = addDays(k, 1)) {
        var p = incl(nightPrice(k));
        roomTotal += p;
        nightRows.push({ label: fmt(k) + (isHoliday(k) ? T.holidayTag : (isWeekendNight(k) ? T.weekendTag : '')), amount: money(p) });
      }
    }
    var nights = nightRows.length, hasNights = nights > 0;
    var rooms = roomsFor(state.guests), extra = rooms - CONFIG.baseRooms;
    var extraTotal = extra * incl(CONFIG.extraRoomPrice) * nights;
    var subtotal = roomTotal + extraTotal;
    var total = subtotal, net = total * 100 / (100 + CONFIG.tourismTax + CONFIG.vat);
    var taxAmt = net * CONFIG.tourismTax / 100, vatAmt = net * CONFIG.vat / 100;
    var taxLines = [];
    var priceLines = [];
    if (hasNights) {
      priceLines.push({ label: T.stayLine(nights), amount: money(roomTotal) });
      if (extra > 0) priceLines.push({ label: T.extraLine(extra, nights), amount: money(extraTotal) });
      taxLines.push({ label: T.taxLine(CONFIG.tourismTax), amount: money(taxAmt) });
      taxLines.push({ label: T.vatLine(CONFIG.vat), amount: money(vatAmt) });
    }
    // Camas: siempre suman exactamente el número de habitaciones asignadas
    var kMin = Math.max(0, rooms - CONFIG.maxTwin), kMax = Math.min(CONFIG.maxKing, rooms);
    var kings = Math.min(kMax, Math.max(kMin, state.kings)), twins = rooms - kings;

    var missing = [];
    if (!hasNights) missing.push(T.mDates);
    if (!state.confirmed) missing.push(T.mGuests);
    if (!state.name.trim()) missing.push(T.mName);
    if (!state.phone.trim()) missing.push(T.mPhone);
    if (!state.termsOk) missing.push(T.mTerms);

    return {
      L: L, T: T, rtl: rtl, money: money, whole: whole, fmt: fmt, todayKey: todayKey,
      y: y, m: m, first: first, dim: dim,
      nightRows: nightRows, nights: nights, hasNights: hasNights, rooms: rooms, extra: extra,
      priceLines: priceLines, taxLines: taxLines, total: total, kMin: kMin, kMax: kMax, kings: kings, twins: twins,
      missing: missing, canSubmit: missing.length === 0 && !state.submitting
    };
  }

  // ===================== ANIMACIÓN DE LA PIEDRA =====================
  // Las piezas aparecen suavemente de arriba hacia abajo, la piedra completa se
  // desvanece y se vuelve a armar. Con loop=false se arma 2 veces y queda armada.
  var STONE_SVG = document.querySelector('#splash svg').outerHTML.replace(/lzg/g, 'lzg2').replace(/ class="[^"]*"/, '');
  function stoneLoop(svg, loop) {
    var paths = svg.querySelectorAll('path'), timers = [], H = 1374;
    svg.classList.add('lz-stone');
    for (var i = 0; i < paths.length; i++) {
      var y = 0;
      try { var b = paths[i].getBBox(); y = b.y + b.height / 2; } catch (e) { y = i / paths.length * H; }
      paths[i].style.setProperty('--d', (y / H * 1.0).toFixed(2) + 's');
    }
    var count = 0;
    function cycle() {
      svg.classList.remove('run', 'out');
      void svg.getBoundingClientRect();
      svg.classList.add('run');
      count++;
      if (loop || count < 2) {
        timers.push(setTimeout(function () { svg.classList.add('out'); }, 2050));
        timers.push(setTimeout(cycle, 2600));
      }
    }
    cycle();
    return function () { timers.forEach(clearTimeout); };
  }

  // ===================== PLANTILLAS =====================
  function tplLang() {
    var langs = [
      ['es', 'ES', 'Español', 'Continuar en español', 'ltr'],
      ['en', 'EN', 'English', 'Continue in English', 'ltr'],
      ['ar', 'ع', 'العربية', 'المتابعة باللغة العربية', 'rtl']
    ];
    return '<div class="lz-lang" dir="ltr">' +
      '<img class="lz-lang-wm" src="img/stone.svg" alt="" aria-hidden="true">' +
      '<div class="lz-lang-box">' +
      '<img class="lz-lang-stone" src="img/stone.svg" alt="Lazurde">' +
      '<p class="lz-lang-hello">Welcome · Bienvenido · <span lang="ar">أهلاً بك</span></p>' +
      '<h1 class="lz-lang-title">Select your language</h1>' +
      '<div class="lz-lang-rule" aria-hidden="true"><span></span><i></i><span></span></div>' +
      '<div class="lz-lang-list">' +
      langs.map(function (l, i) {
        return '<button type="button" class="lz-lang-btn" data-act="lang" data-arg="' + l[0] + '" dir="' + l[4] + '" lang="' + l[0] + '" style="animation-delay:' + (0.25 + i * 0.12) + 's">' +
          '<span class="lz-lang-code">' + l[1] + '</span>' +
          '<span class="lz-lang-txt"><strong>' + l[2] + '</strong><small>' + l[3] + '</small></span>' +
          svg(l[4] === 'rtl' ? ICON.left : ICON.right, { w: 20, sw: 2, stroke: '#FAD26D', style: 'flex:none' }) + '</button>';
      }).join('') + '</div></div></div>';
  }

  function tplMonthNav(c) {
    var T = c.T;
    return '<div style="position:relative;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<button type="button" class="icon-btn" data-act="prevMonth" aria-label="' + T.prevMonth + '"' + (state.month <= 0 ? ' disabled style="opacity:.35"' : '') + '>' + svg(c.rtl ? ICON.right : ICON.left, { w: 18, sw: 2 }) + '</button>' +
      '<span style="font-size:16px;font-weight:800;text-transform:capitalize">' + T.months[c.m] + ' ' + c.y + '</span>' +
      '<button type="button" class="icon-btn" data-act="nextMonth" aria-label="' + T.nextMonth + '"' + (state.month >= CONFIG.monthsAhead ? ' disabled style="opacity:.35"' : '') + '>' + svg(c.rtl ? ICON.left : ICON.right, { w: 18, sw: 2 }) + '</button></div>' +
      '<div class="cal-grid cal-head">' + c.T.wd.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>';
  }

  function tplCalendar(c, interactive) {
    var T = c.T, out = '';
    for (var i = 0; i < c.first; i++) out += '<span class="cell blank"></span>';
    for (var d = 1; d <= c.dim; d++) {
      var k = keyOf(c.y, c.m, d), price = nightPrice(k), past = k < c.todayKey, booked = isBooked(k), hol = isHoliday(k), we = isWeekendNight(k);
      var pc = '#A57F12';
      var cls = 'cell', label = String(incl(price)), dis = false, labelColor = pc;
      if (!interactive) {
        if (hol) cls += ' hol';
        if (booked) { cls += ' booked'; label = T.booked; }
        if (past) { cls += ' past'; label = ''; }
        out += '<div class="' + cls + '"><span>' + d + '</span><small style="color:' + (booked ? '#4F5B69' : labelColor) + '">' + label + '</small></div>';
        continue;
      }
      var canEnd = !!(state.checkin && !state.checkout && k > state.checkin && rangeOk(state.checkin, k));
      var isIn = k === state.checkin, isOut = k === state.checkout;
      var inRange = !!(state.checkin && state.checkout && k > state.checkin && k < state.checkout);
      dis = past || (booked && !canEnd && !isOut);
      if (hol) cls += ' hol';
      if (booked && !isIn && !isOut) {
        if (canEnd) { cls += ' can-out'; label = T.outOnly; labelColor = '#4F5B69'; }
        else { cls += ' booked'; label = T.booked; labelColor = '#4F5B69'; }
      }
      if (inRange) { cls += ' range'; labelColor = '#0B2E4F'; }
      if (isIn || isOut) { cls += ' sel'; label = isIn ? T.cin : T.cout; labelColor = ''; }
      if (past) { cls = 'cell past'; label = ''; }
      out += '<button type="button" class="' + cls + '" data-act="pick" data-arg="' + k + '"' + (dis ? ' disabled' : '') +
        ' aria-label="' + esc(T.ariaCell(d, T.months[c.m], booked, incl(price), isIn, isOut)) + '"><span>' + d + '</span><small' + (labelColor ? ' style="color:' + labelColor + '"' : '') + '>' + label + '</small></button>';
    }
    return '<div class="cal"><img class="wm" src="img/stone.svg" alt="">' + tplMonthNav(c) + '<div class="cal-grid">' + out + '</div>' +
      (interactive ? '' : '<div style="position:relative;display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:12px;color:#5A6573">' +
        '<span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;border:1.5px solid #D3AE2A"></span>' + T.lgHoliday + '</span>' +
        '<span style="display:flex;align-items:center;gap:6px"><s style="color:#8A94A1;font-weight:700">8</s>' + T.lgBooked + '</span></div>') +
      '</div>';
  }

  function tplTerms(T) {
    var lines = '';
    for (var i = 1; i <= 10; i++) lines += '<p style="margin:0 0 8px;font-size:14px;color:#3D4A58;line-height:1.6">' + esc(T.termLine(i)) + '</p>';
    return '<div class="terms-box' + (state.termsOpen ? ' open' : '') + '">' + lines + '</div>' +
      '<button type="button" class="btn-outline" data-act="toggleTerms">' + (state.termsOpen ? T.showLess : T.showMore) + '</button>';
  }

  function tplGallery(c) {
    var T = c.T, gi = ((state.gIdx % GAL_BG.length) + GAL_BG.length) % GAL_BG.length;
    return '<div id="lz-top" class="lz-gal" style="position:relative;height:280px;background:' + GAL_BG[gi] + ';display:flex;align-items:center;justify-content:center">' +
      '<span style="position:absolute;inset-inline-start:16px;top:14px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff">' + T.gal[gi] + '</span>' +
      (gi === 0 ? '<span aria-hidden="true" style="width:66px;height:66px;border-radius:999px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25)"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#0F4C81"></path></svg></span>' : '') +
      '<button type="button" class="icon-btn" data-act="gPrev" aria-label="' + T.prevPhoto + '" style="position:absolute;inset-inline-start:10px;top:118px;border:0;background:rgba(255,255,255,.85)">' + svg(c.rtl ? ICON.right : ICON.left, { w: 20, sw: 2 }) + '</button>' +
      '<button type="button" class="icon-btn" data-act="gNext" aria-label="' + T.nextPhoto + '" style="position:absolute;inset-inline-end:10px;top:118px;border:0;background:rgba(255,255,255,.85)">' + svg(c.rtl ? ICON.left : ICON.right, { w: 20, sw: 2 }) + '</button>' +
      '<span style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(0,0,0,.75);color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;white-space:nowrap">' + T.of(gi + 1, GAL_BG.length) + '</span>' +
      '<div style="position:absolute;inset-inline-end:12px;bottom:10px;display:flex;gap:8px">' +
      '<button type="button" class="icon-btn" data-act="like" aria-label="' + T.fav + '" aria-pressed="' + state.liked + '" style="border:0">' + svg(ICON.heart, { w: 20, fill: state.liked ? '#D9364F' : 'none', stroke: state.liked ? '#D9364F' : '#0B2E4F' }) + '</button>' +
      '<button type="button" class="icon-btn" data-act="share" aria-label="' + T.share + '" style="border:0">' + svg(ICON.share, { w: 20 }) + '</button></div></div>';
  }

  // Zonas del resort: una fila que se desliza (las fotos se agregan en AREA_IMG)
  function tplAreas(c) {
    var T = c.T, icons = [0, 4, 8, 7, 1, 2, 5, 11];
    return '<div class="gap8"></div><section class="card" style="padding:20px 0 18px"><div style="padding:0 18px"><h2 class="h2">' + T.areasTitle + '</h2><p class="muted" style="font-size:13px;margin-top:4px">' + T.areasSub + '</p></div>' +
      '<div class="lz-areas">' + T.areas.map(function (name, i) {
        var img = AREA_IMG[i];
        return '<figure class="lz-area" style="background:' + (img ? 'url(' + img + ') center/cover' : AREA_BG[i % AREA_BG.length]) + '">' +
          (img ? '' : '<span aria-hidden="true" style="position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);opacity:.35">' + svg(FAC_ICONS[icons[i]], { w: 64, stroke: '#fff', sw: 1.2 }) + '</span>') +
          '<figcaption><span class="lz-area-n">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span class="lz-area-name">' + name + '</span></figcaption></figure>';
      }).join('') + '</div></section>';
  }

  function tplHome(c) {
    var T = c.T;
    var fac = T.fac.map(function (lb, i) { return { label: lb, d: FAC_ICONS[i] }; });
    var facShown = state.showAllFac ? fac : fac.slice(0, 5);
    var h = '';
    // Barra superior
    h += '<header class="fixed-top" style="height:60px;background:#fff;border-bottom:1px solid #E3E8EE;display:flex;align-items:center;justify-content:space-between;padding:0 10px">' +
      '<button type="button" class="icon-btn" data-act="openLang" aria-label="' + T.changeLang + '">' + svg(ICON.globe, { sw: 1.7 }) + '</button>' +
      '<img src="img/wordmark.svg" alt="Lazurde" style="height:26px;width:auto">' +
      '<button type="button" class="icon-btn" aria-label="' + T.waAria + '">' + svg(ICON.chatDots, { sw: 1.7 }) + '</button></header>';
    h += '<main style="padding-top:calc(60px + env(safe-area-inset-top));padding-bottom:calc(190px + env(safe-area-inset-bottom))">';
    // Galería
    h += tplGallery(c);
    // Título
    h += '<div style="background:#fff;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><h1 style="font-size:24px;font-weight:800;line-height:1.25">' + T.resortName + '</h1>' +
      '<span style="flex:none;background:#EAF1F8;color:#0F4C81;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px">' + T.badge + '</span></div>' +
      '<span style="font-size:14px;color:#5A6573;display:flex;align-items:center;gap:6px">' + svg(ICON.pin, { w: 16 }) + T.location + '</span>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' + T.specs.map(function (s) { return '<span style="background:#F5F7FA;border:1px solid #E3E8EE;border-radius:999px;padding:6px 11px;font-size:13px;font-weight:600">' + s + '</span>'; }).join('') + '</div>' +
      '<span style="font-size:12px;color:#5A6573">' + T.license + '</span></div>';
    // Contacto
    h += '<div id="lz-contact" style="background:#fff;padding:0 18px 18px;display:flex;gap:10px">' +
      '<button type="button" style="flex:1;height:48px;border-radius:14px;border:0;background:#E7F5EC;color:#14532D;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:700;cursor:pointer">' + svg(ICON.chat, { w: 20 }) + T.whatsapp + '</button>' +
      '<button type="button" style="flex:1;height:48px;border-radius:14px;border:0;background:#EAF1F8;color:#0F4C81;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:700;cursor:pointer">' + svg(ICON.phone, { w: 20 }) + T.call + '</button></div>';
    // Zonas del resort
    h += tplAreas(c);
    // Disponibilidad
    h += '<div class="gap8"></div><section id="lz-cal" class="card"><h2 class="h2" style="margin-bottom:4px">' + T.availability + '</h2>' +
      '<p class="muted" style="font-size:13px;line-height:1.5;margin-bottom:14px">' + T.availSub + '</p>' + tplCalendar(c, false) +
      '<p class="muted" style="margin-top:12px;font-size:13px;line-height:1.5">' + T.toChoose + '</p></section>';
    // Horarios
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:14px"><h2 class="h2">' + T.times + '</h2>' +
      '<div style="display:flex;align-items:center;gap:14px"><span style="width:44px;height:44px;border-radius:12px;background:#EAF1F8;color:#0F4C81;display:flex;align-items:center;justify-content:center">' + svg(ICON.clockIn) + '</span><div style="display:flex;flex-direction:column"><strong style="font-size:15px">' + T.checkIn + '</strong><span class="muted" style="font-size:14px">' + T.checkInTime + '</span></div></div>' +
      '<div style="display:flex;align-items:center;gap:14px"><span style="width:44px;height:44px;border-radius:12px;background:#EAF1F8;color:#0F4C81;display:flex;align-items:center;justify-content:center">' + svg(ICON.clockOut) + '</span><div style="display:flex;flex-direction:column"><strong style="font-size:15px">' + T.checkOut + '</strong><span class="muted" style="font-size:14px">' + T.checkOutTime + '</span></div></div></section>';
    // Habitaciones
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.rooms + '</h2>' +
      roomCard(ICON.king, T.kingRooms, T.kingRoomsSub) + roomCard(ICON.twin, T.twinRooms, T.twinRoomsSub) +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#FFF6DF;border-radius:12px;padding:12px 14px"><span style="font-size:14px;font-weight:600;color:#5C4510">' + T.extraRoom + '</span><strong style="font-size:15px;color:#5C4510;white-space:nowrap">' + c.whole(incl(CONFIG.extraRoomPrice)) + T.perNightShort + '</strong></div></section>';
    // Instalaciones
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:6px"><h2 class="h2" style="margin-bottom:6px">' + T.facilities + '</h2>' +
      facShown.map(function (f) { return '<div style="display:flex;align-items:center;gap:14px;min-height:44px">' + svg(f.d, { w: 24, stroke: '#0F4C81', sw: 1.6 }) + '<span style="font-size:15px">' + f.label + '</span></div>'; }).join('') +
      '<button type="button" class="btn-outline" style="margin-top:8px" data-act="toggleFac">' + (state.showAllFac ? T.showLess : T.showAll(fac.length)) + '</button></section>';
    // Ubicación
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.where + '</h2>' +
      '<div style="position:relative;height:180px;border-radius:16px;overflow:hidden;background-color:#EEF1EC;background-image:linear-gradient(90deg,rgba(255,255,255,.9) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.9) 2px,transparent 2px);background-size:46px 46px"><span aria-hidden="true" style="position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:999px;background:rgba(15,76,129,.22);border:2px solid #0F4C81"></span></div>' +
      '<p class="muted" style="font-size:14px;line-height:1.6">' + T.whereNote + '</p></section>';
    // Depósito
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.deposit + '</h2>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #E3E8EE;border-radius:14px;padding:14px 16px"><span style="font-size:15px;font-weight:600">' + T.depositAmount + '</span><strong style="font-size:17px">' + c.whole(CONFIG.deposit) + '</strong></div>' +
      '<p class="muted" style="font-size:14px;line-height:1.6">' + T.depositNote + '</p></section>';
    // Eventos permitidos
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.allowedEvents + '</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' +
      T.events.slice(0, 8).map(function (e) { return '<span style="display:flex;align-items:center;gap:8px;background:#F5F7FA;border-radius:10px;padding:10px 12px;font-size:14px"><span style="width:6px;height:6px;border-radius:999px;background:#D3AE2A;flex:none"></span>' + e + '</span>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF6DF;border-radius:12px;padding:12px 14px">' + svg(ICON.info, { w: 20, stroke: '#5C4510', style: 'flex:none;margin-top:1px' }) +
      '<span style="font-size:13px;color:#5C4510;line-height:1.5;font-weight:600">' + T.eventsNote + '</span></div></section>';
    // Políticas
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.policies + '</h2>' +
      '<div style="border:1px solid #F3C9C9;background:#FDF2F2;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px"><strong style="font-size:15px;color:#8B1D1D">' + T.cancellation + '</strong><span style="font-size:14px;color:#6E1A1A;line-height:1.6">' + T.tbd + '</span></div>' +
      '<div style="border:1px solid #EFDFA6;background:#FFFBEA;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px"><strong style="font-size:15px;color:#6B4F00">' + T.dateChange + '</strong><span style="font-size:14px;color:#5C4510;line-height:1.6">' + T.tbd + '</span></div>' +
      '<h3 style="margin-top:8px;font-size:16px;font-weight:800">' + T.terms + '</h3>' + tplTerms(T) + '</section>';
    h += '<div class="muted" style="padding:22px 18px;text-align:center;font-size:12px">' + T.footer + '</div></main>';
    // Barra de reservar + navegación
    h += '<div class="fixed-bottom" style="padding:0 12px calc(14px + env(safe-area-inset-bottom))">' +
      '<div style="background:#fff;border:1px solid #E3E8EE;border-radius:18px;padding:10px;padding-inline-start:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 10px 30px rgba(11,46,79,.14);margin-bottom:10px">' +
      '<div style="display:flex;flex-direction:column;gap:1px"><span class="muted" style="font-size:12px">' + T.from + '</span><span style="font-size:18px;font-weight:800">' + c.whole(incl(CONFIG.weekdayPrice)) + ' <span class="muted" style="font-size:13px;font-weight:600">' + T.perNight + '</span></span><span class="muted" style="font-size:11px">' + T.baseInfo + '</span></div>' +
      '<button type="button" class="btn-primary" data-act="goBook" style="height:50px;padding:0 26px">' + T.bookNow + '</button></div>' +
      '<nav aria-label="' + T.navAria + '" style="height:68px;background:#fff;border-radius:999px;box-shadow:0 10px 30px rgba(11,46,79,.14);display:flex;align-items:center;justify-content:space-around;padding:0 8px">' +
      navItem('#lz-top', ICON.home, T.navHome, true) + navItem('#lz-cal', ICON.cal, T.navCal) + navItem('#lz-contact', ICON.chat, T.navContact) +
      '</nav></div>';
    return h;
  }
  function roomCard(d, title, sub) {
    return '<div style="display:flex;align-items:center;gap:14px;border:1px solid #E3E8EE;border-radius:14px;padding:14px">' + svg(d, { w: 40, h: 30, vb: '0 0 32 24', stroke: '#0B2E4F', sw: 1.6 }) +
      '<div style="display:flex;flex-direction:column;gap:2px"><strong style="font-size:15px">' + title + '</strong><span class="muted" style="font-size:13px">' + sub + '</span></div></div>';
  }
  function navItem(href, d, label, active) {
    return '<a href="' + href + '" style="min-width:66px;height:56px;border-radius:999px;' + (active ? 'background:#EAF1F8;color:#0F4C81;font-weight:700;' : 'color:#3D4A58;font-weight:600;') +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;font-size:11px">' + svg(d) + label + '</a>';
  }

  function tplBook(c) {
    var T = c.T, h = '';
    var waitingOut = !!(state.checkin && !state.checkout);
    var on = state.confirmed;
    var box = function (active) { return 'border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;border:' + (active ? '2px solid #0F4C81;background:#F2F7FC' : '1.5px solid #0B2E4F') + ';'; };
    h += '<header class="fixed-top" style="height:60px;background:#fff;border-bottom:1px solid #E3E8EE;display:flex;align-items:center;gap:8px;padding:0 10px">' +
      '<button type="button" class="icon-btn" data-act="goHome" aria-label="' + T.back + '" style="border:0">' + svg(c.rtl ? ICON.backR : ICON.backL, { sw: 2 }) + '</button>' +
      '<span style="font-size:17px;font-weight:800">' + T.confirmTitle + '</span></header>';
    h += '<main style="padding-top:calc(60px + env(safe-area-inset-top));padding-bottom:calc(140px + env(safe-area-inset-bottom))">';
    h += '<div style="background:#fff;padding:14px 18px;display:flex;align-items:center;gap:14px"><span style="width:64px;height:64px;border-radius:14px;background:linear-gradient(160deg,#0B2E4F,#1F6FB2);flex:none;display:flex;align-items:center;justify-content:center"><img src="img/stone.svg" alt="" style="width:30px;height:auto"></span>' +
      '<div style="display:flex;flex-direction:column;gap:2px"><strong style="font-size:17px">' + T.resortName + '</strong><span class="muted" style="font-size:13px">' + T.summarySub + '</span></div></div>';
    // Fechas
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.dates + '</h2>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
      '<div style="' + box(!state.checkin) + '"><span class="muted" style="font-size:12px;font-weight:700">' + T.checkIn + '</span><strong style="font-size:15px">' + c.fmt(state.checkin) + '</strong><span class="muted" style="font-size:12px">' + T.inShort + '</span></div>' +
      '<div style="' + box(waitingOut) + '"><span class="muted" style="font-size:12px;font-weight:700">' + T.checkOut + '</span><strong style="font-size:15px">' + c.fmt(state.checkout) + '</strong><span class="muted" style="font-size:12px">' + T.outShort + '</span></div></div>' +
      tplCalendar(c, true) +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:14px;font-weight:700">' + (c.hasNights ? T.nightsTxt(c.nights) : T.noDates) + '</span>' +
      '<button type="button" data-act="clearDates" style="height:44px;padding:0 12px;border:0;background:transparent;color:#0F4C81;font-size:14px;font-weight:700;cursor:pointer;text-decoration:underline">' + T.clearDates + '</button></div>' +
      '<p style="font-size:13px;line-height:1.5;' + (waitingOut ? 'color:#0F4C81;font-weight:700' : 'color:#5A6573') + '">' + (waitingOut ? T.hintOut : T.hintIn) + '</p></section>';
    // Personas
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.guests + '</h2>' +
      '<div style="border:1px solid #E3E8EE;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:14px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:12px"><span style="width:44px;height:44px;border-radius:12px;background:#EAF1F8;color:#0F4C81;display:flex;align-items:center;justify-content:center;flex:none">' + svg(ICON.people, { w: 24, sw: 1.7 }) + '</span>' +
      '<div style="display:flex;flex-direction:column"><strong style="font-size:15px">' + T.guests + '</strong><span class="muted" style="font-size:12px">' + T.guestsRange + '</span></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px"><button type="button" class="stepper" data-act="guestsMinus" aria-label="' + T.minusGuest + '"' + (state.guests <= CONFIG.baseGuests ? ' disabled' : '') + '>−</button>' +
      '<span style="min-width:24px;text-align:center;font-size:18px;font-weight:800">' + state.guests + '</span>' +
      '<button type="button" class="stepper" data-act="guestsPlus" aria-label="' + T.plusGuest + '"' + (state.guests >= CONFIG.maxGuests ? ' disabled' : '') + '>+</button></div></div>' +
      '<div style="height:1px;background:#E3E8EE"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:12px"><span style="width:44px;height:44px;border-radius:12px;background:#F5F7FA;color:#3D4A58;display:flex;align-items:center;justify-content:center;flex:none">' + svg(ICON.lock, { sw: 1.7 }) + '</span>' +
      '<div style="display:flex;flex-direction:column"><strong style="font-size:15px">' + T.rooms + '</strong><span class="muted" style="font-size:12px">' + T.autoRooms + '</span></div></div>' +
      '<span style="min-width:44px;text-align:center;font-size:20px;font-weight:800">' + c.rooms + '</span></div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF6DF;border-radius:12px;padding:12px">' + svg(ICON.info, { w: 20, stroke: '#7A5A12', style: 'flex:none;margin-top:1px' }) +
      '<strong style="font-size:13px;color:#5C4510;line-height:1.5">' + T.extraNotice(c.whole(incl(CONFIG.extraRoomPrice))) + '</strong></div>' +
      (on ? '<div style="display:flex;align-items:center;gap:10px;background:#E7F5EC;color:#14532D;border-radius:12px;padding:12px;font-size:14px;font-weight:700">' + svg(ICON.check, { w: 20, sw: 2.2, style: 'flex:none' }) + T.confirmedTxt(state.guests, c.rooms) + '</div>'
        : '<button type="button" class="btn-primary" data-act="confirmGuests" style="height:50px">' + T.confirmBtn(state.guests) + '</button>') +
      '</div></section>';
    // Camas
    var kMinus = !on || c.kings <= c.kMin, kPlus = !on || c.kings >= c.kMax;
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.beds + '</h2>' +
      (on ? '' : '<div style="display:flex;gap:10px;align-items:center;background:#F5F7FA;border-radius:12px;padding:12px;font-size:13px;color:#3D4A58">' + svg(ICON.lock, { w: 18, style: 'flex:none' }) + T.bedsLocked + '</div>') +
      '<div style="border:1px solid #E3E8EE;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:14px;' + (on ? '' : 'opacity:.45') + '"' + (on ? '' : ' aria-disabled="true"') + '>' +
      bedRow(ICON.king, T.kingBed, T.kingBedSub, 'kingMinus', 'kingPlus', T.kingMinusAria, T.kingPlusAria, kMinus, kPlus, c.kings) +
      '<div style="height:1px;background:#E3E8EE"></div>' +
      bedRow(ICON.twin, T.twinBed, T.twinBedSub, 'kingPlus', 'kingMinus', T.twinMinusAria, T.twinPlusAria, kPlus, kMinus, c.twins) +
      '<div style="display:flex;align-items:center;justify-content:space-between;background:#F5F7FA;border-radius:10px;padding:10px 12px;font-size:13px"><span style="color:#3D4A58">' + T.assigned + '</span><strong>' + (on ? (c.kings + c.twins) : '—') + T.ofWord + c.rooms + '</strong></div>' +
      '</div></section>';
    // Motivo
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.purpose + ' <span class="muted" style="font-size:13px;font-weight:600">' + T.optional + '</span></h2>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + T.events.map(function (e, i) { return '<button type="button" class="chip" data-act="event" data-arg="' + i + '" aria-pressed="' + (state.event === i) + '">' + e + '</button>'; }).join('') + '</div></section>';
    // Datos
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.details + '</h2>' +
      '<label for="lz-name" class="label">' + T.fullName + '</label><input id="lz-name" class="field" type="text" autocomplete="name" data-field="name" value="' + esc(state.name) + '" placeholder="' + esc(T.namePh) + '">' +
      '<label for="lz-phone" class="label">' + T.phone + '</label><div dir="ltr" style="display:flex;gap:8px"><span style="height:50px;min-width:70px;border:1px solid #C9D2DC;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;background:#F5F7FA">+968</span>' +
      '<input id="lz-phone" class="field" type="tel" inputmode="tel" autocomplete="tel" data-field="phone" value="' + esc(state.phone) + '" placeholder="9123 4567" style="flex:1;min-width:0"></div>' +
      '<label for="lz-email" class="label">' + T.email + '</label><input id="lz-email" class="field" dir="ltr" type="email" autocomplete="email" data-field="email" value="' + esc(state.email) + '" placeholder="name@email.com"></section>';
    // Precio
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px"><h2 style="font-size:18px;font-weight:800;margin-bottom:4px">' + T.priceDetails + '</h2>';
    if (c.hasNights) {
      h += '<div style="border:1px solid #E3E8EE;border-radius:14px;overflow:hidden"><div style="display:flex;justify-content:space-between;background:#F5F7FA;padding:8px 12px;font-size:12px;font-weight:700;color:#3D4A58"><span>' + T.night + '</span><span>' + T.price + '</span></div>' +
        c.nightRows.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-top:1px solid #EEF2F6;font-size:14px"><span>' + r.label + '</span><span style="font-weight:700;white-space:nowrap">' + r.amount + '</span></div>'; }).join('') + '</div>' +
        c.priceLines.map(function (p) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;color:#3D4A58"><span>' + p.label + '</span><span style="color:#0B2E4F;font-weight:700;white-space:nowrap">' + p.amount + '</span></div>'; }).join('') +
        '<div style="height:1px;background:#E3E8EE;margin:4px 0"></div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><strong style="font-size:16px">' + T.totalLabel + '</strong><strong style="font-size:22px;white-space:nowrap">' + c.money(c.total) + '</strong></div>' +
        '<div style="background:#F5F7FA;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px"><span class="muted" style="font-size:12px;font-weight:700">' + T.inclTaxes + '</span>' +
        c.taxLines.map(function (p) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#5A6573"><span>' + p.label + '</span><span style="white-space:nowrap">' + p.amount + '</span></div>'; }).join('') + '</div>';
    } else {
      h += '<span class="muted" style="font-size:14px">' + T.pickToSee + '</span>';
    }
    h += '<div style="display:flex;gap:10px;align-items:flex-start;background:#F5F7FA;border-radius:12px;padding:12px;margin-top:4px">' + svg(ICON.info, { w: 20, stroke: '#3D4A58', style: 'flex:none;margin-top:1px' }) +
      '<span style="font-size:13px;color:#3D4A58;line-height:1.5">' + T.depositBook(c.whole(CONFIG.deposit)) + '</span></div></section>';
    // Términos
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.terms + '</h2>' + tplTerms(T) +
      '<label for="lz-terms" style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;padding:6px 0"><input id="lz-terms" type="checkbox" data-act="termsOk"' + (state.termsOk ? ' checked' : '') + ' style="width:24px;height:24px;margin:0;flex:none;accent-color:#0F4C81">' +
      '<span style="font-size:14px;line-height:1.5">' + T.accept + '</span></label></section></main>';
    h += '<div id="lz-bar" class="fixed-bottom" style="background:#fff;border-top:1px solid #E3E8EE;padding:10px 16px calc(18px + env(safe-area-inset-bottom))">' + tplBar(c) + '</div>';
    return h;
  }
  function bedRow(icon, title, sub, actMinus, actPlus, ariaMinus, ariaPlus, disMinus, disPlus, val) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:12px">' + svg(icon, { w: 44, h: 33, vb: '0 0 32 24', stroke: '#0B2E4F', sw: 1.6, style: 'flex:none' }) +
      '<div style="display:flex;flex-direction:column"><strong style="font-size:15px">' + title + '</strong><span class="muted" style="font-size:12px">' + sub + '</span></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px"><button type="button" class="stepper" data-act="' + actMinus + '" aria-label="' + ariaMinus + '"' + (disMinus ? ' disabled' : '') + '>−</button>' +
      '<span style="min-width:20px;text-align:center;font-size:18px;font-weight:800">' + val + '</span>' +
      '<button type="button" class="stepper" data-act="' + actPlus + '" aria-label="' + ariaPlus + '"' + (disPlus ? ' disabled' : '') + '>+</button></div></div>';
  }
  function tplBar(c) {
    var T = c.T, ok = c.canSubmit || state.submitting;
    return (c.missing.length ? '<p style="font-size:12px;color:#8B1D1D;text-align:center;margin-bottom:6px">' + T.missing + c.missing.join(T.sep) + '</p>' : '') +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div style="display:flex;flex-direction:column"><strong style="font-size:20px;white-space:nowrap">' + (c.hasNights ? c.money(c.total) : '—' + T.unit) + '</strong>' +
      '<span class="muted" style="font-size:11px">' + (c.hasNights ? T.barSub(c.nights, c.rooms) : T.pickDates) + '</span></div>' +
      '<button type="button" data-act="submit"' + (c.canSubmit ? '' : ' disabled') + ' style="height:52px;min-width:150px;padding:0 22px;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:800;' +
      (ok ? 'background:radial-gradient(circle at 50% 50%,#104862 0%,#003047 100%);color:#fff;cursor:pointer' : 'background:#E3E8EE;color:#4F5B69;cursor:not-allowed') + '">' +
      (state.submitting ? STONE_SVG.replace('<svg ', '<svg class="lz-stone" role="img" aria-label="' + T.sending + '" style="width:30px;height:40px" ') : '<span>' + T.bookNow + '</span>') + '</button></div>';
  }

  function tplDone(c) {
    var T = c.T;
    var rows = [[T.rIn, c.fmt(state.checkin)], [T.rOut, c.fmt(state.checkout)], [T.rGuests, T.guestsTxt(state.guests)], [T.rRooms, T.roomsTxt(c.rooms, c.kings, c.twins)],
      [T.rPurpose, state.event === null ? T.notGiven : T.events[state.event]], [T.rTotal, c.hasNights ? c.money(c.total) : '—']];
    return '<main style="background:#fff;min-height:100vh;padding:48px 22px 28px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
      '<svg class="lz-pop" width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" style="flex:none"><circle cx="48" cy="48" r="44" fill="#E7F5EC" stroke="#1F8A4C" stroke-width="3"></circle><path class="lz-check" d="M30 49l12 12 24-26" fill="none" stroke="#1F8A4C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
      '<h1 class="lz-up" style="margin-top:4px;font-size:26px;font-weight:800;text-align:center">' + T.sentTitle + '</h1>' +
      '<p class="lz-up" style="font-size:15px;color:#3D4A58;line-height:1.6;text-align:center">' + T.sentText + '</p>' +
      '<div class="lz-up" style="width:100%;border:1px solid #E3E8EE;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span class="muted">' + T.code + '</span><strong style="color:#0F4C81">LZ-0001' + T.example + '</strong></div>' +
      rows.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span class="muted">' + r[0] + '</span><strong style="text-align:end">' + esc(r[1]) + '</strong></div>'; }).join('') + '</div>' +
      '<div class="lz-up" style="width:100%;background:#FFF6DF;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;font-size:15px;color:#5C4510;line-height:1.4"><strong style="font-size:16px">' + T.remember + '</strong>' +
      '<span style="display:flex;align-items:center;gap:10px">' + svg(ICON.clockIn, { w: 20, stroke: '#5C4510' }) + '<strong>' + T.remIn + '</strong></span>' +
      '<span style="display:flex;align-items:center;gap:10px">' + svg(ICON.clockOut, { w: 20, stroke: '#5C4510' }) + '<strong>' + T.remOut + '</strong></span>' +
      '<div style="margin-top:4px;background:#fff;border:1.5px solid #D3AE2A;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">' + svg(ICON.info, { w: 22, stroke: '#5C4510', style: 'flex:none' }) + '<strong style="font-size:17px;color:#0B2E4F;line-height:1.35">' + T.depositRem(c.whole(CONFIG.deposit)) + '</strong></div></div>' +
      '<button type="button" class="btn-primary" data-act="restart" style="width:100%">' + T.backHome + '</button></main>';
  }

  // ===================== DIBUJAR =====================
  var app = document.getElementById('app');
  function render() {
    var c = calc();
    document.documentElement.lang = c.L;
    document.documentElement.dir = c.rtl ? 'rtl' : 'ltr';
    var html = '';
    if (state.screen === 'lang') html = tplLang();
    else if (state.screen === 'home') html = tplHome(c);
    else if (state.screen === 'book') html = tplBook(c);
    else if (state.screen === 'done') html = tplDone(c);
    app.innerHTML = html;
  }
  function renderBar() {
    var bar = document.getElementById('lz-bar');
    if (bar) bar.innerHTML = tplBar(calc());
  }

  // ===================== ACCIONES =====================
  var submitTimer = null;
  var actions = {
    lang: function (code) { var first = !introShown; set({ lang: code, screen: 'home' }); if (first) playIntro(); },
    openLang: function () { set({ screen: 'lang' }); },
    goBook: function () { set({ screen: 'book' }); },
    goHome: function () { set({ screen: 'home' }); },
    gPrev: function () { galGo(-1, true); },
    gNext: function () { galGo(1, true); },
    like: function () { set({ liked: !state.liked }); },
    share: function () {
      if (navigator.share) { navigator.share({ title: 'Lazurde Resort', url: location.href }).catch(function () {}); }
    },
    prevMonth: function () { set({ month: Math.max(0, state.month - 1) }); },
    nextMonth: function () { set({ month: Math.min(CONFIG.monthsAhead, state.month + 1) }); },
    toggleFac: function () { set({ showAllFac: !state.showAllFac }); },
    toggleTerms: function () { set({ termsOpen: !state.termsOpen }); },
    pick: function (k) {
      if (state.checkin && !state.checkout && k > state.checkin && rangeOk(state.checkin, k)) { set({ checkout: k }); return; }
      if (isBooked(k)) return;
      set({ checkin: k, checkout: null });
    },
    clearDates: function () { set({ checkin: null, checkout: null }); },
    guestsMinus: function () { setGuests(state.guests - 1); },
    guestsPlus: function () { setGuests(state.guests + 1); },
    confirmGuests: function () { set({ confirmed: true, kings: Math.min(CONFIG.maxKing, roomsFor(state.guests)) }); },
    kingMinus: function () { var c = calc(); if (state.confirmed && c.kings > c.kMin) set({ kings: c.kings - 1 }); },
    kingPlus: function () { var c = calc(); if (state.confirmed && c.kings < c.kMax) set({ kings: c.kings + 1 }); },
    event: function (i) { i = Number(i); set({ event: state.event === i ? null : i }); },
    termsOk: function () { set({ termsOk: !state.termsOk }); },
    submit: function () {
      if (!calc().canSubmit) return;
      set({ submitting: true });
      var sv = document.querySelector('#lz-bar .lz-stone');
      var stop = sv ? stoneLoop(sv, true) : function () {};
      submitTimer = setTimeout(function () { stop(); set({ submitting: false, screen: 'done' }); }, 2600);
    },
    restart: function () {
      set({ screen: 'home', checkin: null, checkout: null, guests: CONFIG.baseGuests, confirmed: false, kings: CONFIG.maxKing, event: null, termsOk: false, termsOpen: false });
    }
  };
  function setGuests(n) {
    var g = Math.max(CONFIG.baseGuests, Math.min(CONFIG.maxGuests, n));
    set({ guests: g, confirmed: false, kings: Math.min(CONFIG.maxKing, roomsFor(g)) });
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    if (el.tagName === 'INPUT') return; // los checkbox se manejan con "change"
    var fn = actions[el.getAttribute('data-act')];
    if (fn) fn(el.getAttribute('data-arg'));
  });
  app.addEventListener('change', function (e) {
    var el = e.target;
    if (el.matches('input[type="checkbox"][data-act]')) actions[el.getAttribute('data-act')]();
  });
  app.addEventListener('input', function (e) {
    var f = e.target.getAttribute('data-field');
    if (f) { state[f] = e.target.value; renderBar(); }
  });

  // ===================== GALERÍA: cambia sola y se desliza con el dedo =====================
  var galLast = 0;
  function galGo(step, byUser) {
    state.gIdx += step;
    if (byUser) galLast = Date.now();
    var el = document.getElementById('lz-top');
    if (el) el.outerHTML = tplGallery(calc());
  }
  setInterval(function () {
    if (state.screen === 'home' && Date.now() - galLast > 8000) galGo(1, false);
  }, 4500);
  var touchX = null;
  app.addEventListener('touchstart', function (e) { touchX = e.target.closest && e.target.closest('#lz-top') ? e.touches[0].clientX : null; }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) galGo((dx < 0) !== (state.lang === 'ar') ? 1 : -1, true);
  }, { passive: true });

  // ===================== ANIMACIÓN DE ENTRADA =====================
  // Se muestra después de escoger el idioma: la piedra se arma sobre el fondo azul,
  // el fondo pasa suavemente al blanco de la página, la piedra se vuelve a armar y entra la página.
  var splash = document.getElementById('splash');
  var splashSvg = splash.querySelector('svg');
  var introShown = false, introTimers = [];
  function endIntro() {
    introTimers.forEach(clearTimeout);
    splash.classList.add('hide');
    setTimeout(function () { splash.style.display = 'none'; }, 450);
  }
  function playIntro() {
    introShown = true;
    splash.classList.remove('hide', 'light');
    splash.style.display = 'flex';
    stoneLoop(splashSvg, false);
    introTimers.push(setTimeout(function () { splash.classList.add('light'); }, 2150));
    introTimers.push(setTimeout(endIntro, 5000));
  }
  splash.addEventListener('click', endIntro);
  splash.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endIntro(); } });
  set({ screen: 'lang' });
})();
