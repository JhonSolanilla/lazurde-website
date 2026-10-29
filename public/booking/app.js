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
    // Precios, feriados y fechas ocupadas llegan del servidor (/api/config). Los de aquí son solo
    // un respaldo mientras carga. Los cupones se validan SOLO en el servidor (src/worker.js).
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
    booked: [],   // fechas ocupadas (por ahora a mano; luego vendrán de la base de datos)
    // Contacto del resort. Si whatsapp queda vacío, el botón Reservar funciona como demostración.
    whatsapp: '96895889552',   // WhatsApp de Lazurde (solo números con indicativo)
    phone: '+96895889552',     // teléfono para el botón Llamar
    email: 'info@lazurdeom.com',
    monthsAhead: 12
  };

  // Motivo de la reserva: los primeros 5 son grupos normales («Ideal para»), del 5 al 10 celebraciones especiales
  // (necesitan autorización) y el último es «Otro». Debe coincidir con EVENTS de src/worker.js y del panel.
  var EV_IDEAL = 5, EV_OTHER = 11;

  // ===================== PREGUNTAS FRECUENTES =====================
  // Solo preguntas con respuesta confirmada. Las que faltan por definir con Salim se agregan después.
  var FAQ_ES = [
    ['¿Se alquila todo el resort?', 'Sí. Durante tu estadía el resort es solo para tu grupo: no se comparte con nadie ni se alquilan habitaciones sueltas.'],
    ['¿Cuántas personas pueden quedarse?', 'De 6 a 14 personas. Los niños cuentan como personas.'],
    ['¿Cómo se asignan las habitaciones?', '6 personas usan 3 habitaciones y cada 2 personas más se abre otra, hasta 7 habitaciones. Tú eliges cama king o dos camas individuales.'],
    ['¿Cuándo queda confirmada mi reserva?', 'Cuando pagas el 100 % del total. Hasta entonces tu solicitud queda pendiente.'],
    ['¿El precio incluye impuestos?', 'Sí. El precio que ves ya incluye el impuesto de turismo (4 %) y el IVA (5 %).'],
    ['¿A qué hora es la llegada y la salida?', 'Llegada a las 2:00 pm y salida a las 11:00 am. Te pedimos puntualidad.'],
    ['¿Cómo funciona el depósito de garantía?', 'Pagas 100 OMR al llegar. Te lo devolvemos dentro de las 24 horas después de la salida, tras una revisión rápida del resort.'],
    ['¿Qué incluye la estadía?', 'Todo lo que ofrece un hotel: sábanas, almohadas, toallas, champú, papel higiénico, wifi y lo básico para habitar. Solo tienes que traer tu ropa.'],
    ['¿Podemos cocinar y hacer parrilla?', 'Sí. Hay cocina completa y zona de barbacoa a gas, con los utensilios incluidos. No necesitas traer carbón.'],
    ['¿Podemos hacer fiestas o eventos?', 'Sí, con aprobación previa de Lazurde. Avísanos al reservar y lo coordinamos por WhatsApp.'],
    ['¿Se permite fumar?', 'Sí, pero solo en las zonas exteriores.'],
    ['¿Hay animales en el resort?', 'Sí. En el mini zoo viven pavos reales, aves, conejos y cabras.'],
    ['¿Hay parqueadero?', 'Sí, privado y dentro del resort.']
  ];
  var FAQ_EN = [
    ['Do we get the whole resort?', 'Yes. During your stay the resort is only for your group: it is never shared and we do not rent single rooms.'],
    ['How many guests can stay?', 'From 6 to 14 guests. Children count as guests.'],
    ['How are the bedrooms assigned?', '6 guests use 3 bedrooms and every 2 more guests open another one, up to 7 bedrooms. You choose a king bed or two twin beds.'],
    ['When is my booking confirmed?', 'When you pay 100% of the total. Until then your request stays pending.'],
    ['Does the price include taxes?', 'Yes. The price you see already includes the tourism tax (4%) and VAT (5%).'],
    ['What are the check-in and check-out times?', 'Check-in at 2:00 pm and check-out at 11:00 am. Please be on time.'],
    ['How does the security deposit work?', 'You pay 100 OMR on arrival. We return it within 24 hours after check-out, following a quick inspection of the resort.'],
    ['What is included in the stay?', 'Everything a hotel provides: bed linen, pillows, towels, shampoo, toilet paper, Wi-Fi and the basics for your stay. You only need to bring your clothes.'],
    ['Can we cook and barbecue?', 'Yes. There is a full kitchen and a gas BBQ area with utensils included. No need to bring charcoal.'],
    ['Can we hold parties or events?', 'Yes, with prior approval from Lazurde. Let us know when booking and we will arrange it on WhatsApp.'],
    ['Is smoking allowed?', 'Yes, but only in the outdoor areas.'],
    ['Are there animals at the resort?', 'Yes. The mini zoo is home to peacocks, birds, rabbits and goats.'],
    ['Is there parking?', 'Yes, private parking inside the resort.']
  ];
  var FAQ_AR = [
    ['هل نستأجر المنتجع كاملًا؟', 'نعم. خلال إقامتكم يكون المنتجع لمجموعتكم فقط: لا يُشارك مع أحد ولا تُؤجر غرف منفردة.'],
    ['كم عدد الضيوف؟', 'من 6 إلى 14 ضيفًا. يُحتسب الأطفال ضمن الضيوف.'],
    ['كيف تُوزّع غرف النوم؟', '6 ضيوف يستخدمون 3 غرف، وكل ضيفين إضافيين تُفتح لهما غرفة أخرى، حتى 7 غرف. تختارون سرير كينغ أو سريرين منفردين.'],
    ['متى يُؤكد حجزي؟', 'عند دفع 100٪ من الإجمالي. وحتى ذلك الحين يبقى طلبكم قيد الانتظار.'],
    ['هل يشمل السعر الضرائب؟', 'نعم. السعر المعروض يشمل ضريبة السياحة (4٪) وضريبة القيمة المضافة (5٪).'],
    ['ما مواعيد الوصول والمغادرة؟', 'الوصول الساعة 2:00 مساءً والمغادرة الساعة 11:00 صباحًا. نرجو الالتزام بالمواعيد.'],
    ['كيف يعمل مبلغ التأمين؟', 'تدفعون 100 ر.ع. عند الوصول، ونعيده خلال 24 ساعة بعد المغادرة بعد فحص سريع للمنتجع.'],
    ['ماذا تشمل الإقامة؟', 'كل ما يوفره الفندق: أغطية الأسرّة والوسائد والمناشف والشامبو وورق التواليت والواي فاي والأساسيات. يكفي أن تحضروا ملابسكم.'],
    ['هل يمكننا الطبخ والشواء؟', 'نعم. يوجد مطبخ كامل ومنطقة شواء تعمل بالغاز مع الأدوات. لا حاجة لإحضار الفحم.'],
    ['هل يمكن إقامة الحفلات والمناسبات؟', 'نعم، بموافقة مسبقة من لازورد. أخبرونا عند الحجز وننسق معكم عبر واتساب.'],
    ['هل التدخين مسموح؟', 'نعم، ولكن في المناطق الخارجية فقط.'],
    ['هل توجد حيوانات في المنتجع؟', 'نعم. في الحديقة الصغيرة طواويس وطيور وأرانب وماعز.'],
    ['هل يوجد موقف للسيارات؟', 'نعم، موقف خاص داخل المنتجع.']
  ];

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
      deposit: 'Depósito de garantía', depositAmount: 'Monto del depósito', notInTotal: 'No está incluido en el total de la reserva.', depositNote: 'Se paga al llegar y se devuelve dentro de las 24 horas posteriores a la salida, después de revisar el resort.',
      idealFor: 'Ideal para', specialTitle: 'Celebraciones especiales', eventsNote: 'Requieren autorización previa de Lazurde. Coordínala con nosotros por WhatsApp después de reservar.', eventNeedsOk: 'Esta celebración necesita autorización previa de Lazurde. Después de reservar, coordínala con nosotros por WhatsApp.',
      events: ['Familia', 'Reunión de hombres', 'Reunión de mujeres', 'Parejas', 'Reunión de trabajo', 'Boda', 'Compromiso / Malka', 'Noche de henna', 'Cumpleaños', 'Graduación', 'Celebración de bebé', 'Otro'],
      policies: 'Políticas', cancellation: 'Cancelación', dateChange: 'Cambio de fecha', refundTitle: 'Reembolsos', tbd: '[Por definir con Salim]',
      terms: 'Términos y condiciones', termLine: function (i) { return i + '. [Término ' + i + ' — texto pendiente. Aquí van los términos y condiciones oficiales de Lazurde Resort.]'; },
      showMore: 'Ver más', footer: 'Lazurde Resort · Omán', privacy: 'Política de privacidad', privacyNote: 'Lee cómo usamos tus datos en nuestra política de privacidad.', waOpen: 'Se abrirá WhatsApp con tu solicitud: solo toca Enviar.',
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
      coupon: 'Cupón de descuento', couponPh: 'Escribe tu código', couponApply: 'Aplicar', couponBad: 'Este cupón no es válido.', couponRemove: 'Quitar', couponOk: function (p) { return '−' + p + '% aplicado'; }, discountLine: function (c, p) { return 'Descuento ' + c + ' (' + p + '%)'; }, rDiscount: function (c, p) { return 'Descuento (' + p + '%)'; }, missing: 'Falta: ', mDates: 'fechas', mGuests: 'confirmar personas', mName: 'nombre', mPhone: 'teléfono válido', ccTitle: 'Indicativo del país', ccSearch: 'Busca país o indicativo', ccClose: 'Cerrar', ccNone: 'Sin resultados', phoneOk: 'Número válido', phoneShort: function (n) { return n === 1 ? 'Falta 1 dígito' : 'Faltan ' + n + ' dígitos'; }, phoneBad: function (c) { return 'Este número no es válido en ' + c; }, phoneDigits: function (l) { return l + ' dígitos'; }, mTerms: 'aceptar los términos',
      barSub: function (n, r) { return n + (n === 1 ? ' noche' : ' noches') + ' · ' + r + ' habitaciones'; }, pickDates: 'Elige tus fechas',
      sending: 'Enviando…',
      sentTitle: '¡Solicitud recibida!', sentText: 'Tus fechas quedaron apartadas. Revisaremos tu solicitud y te confirmaremos por WhatsApp muy pronto.', sentTextWa: 'Envíanos el mensaje de WhatsApp que se abrió para completar tu solicitud. Te confirmaremos muy pronto.', waSend: 'Escribirnos por WhatsApp', errTaken: 'Lo sentimos, esas fechas se acaban de reservar. Por favor elige otras.', errGeneric: 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.',
      code: 'Código de reserva', example: ' (ejemplo)',
      rIn: 'Llegada', rOut: 'Salida', rGuests: 'Personas', rRooms: 'Habitaciones', rPurpose: 'Motivo', rTotal: 'Total',
      guestsTxt: function (n) { return n + ' personas'; }, roomsTxt: function (r, k, t) { return r + ' (' + k + ' king · ' + t + ' de 2 camas)'; }, notGiven: 'No indicado',
      remember: 'Recuerda', remIn: 'Check-in: 2:00 pm', remOut: 'Check-out: 11:00 am', areasTitle: 'Conoce el resort', areasSub: 'Desliza y toca una zona para ver todas sus fotos.', day: 'Día', night: 'Noche', dayNight: 'Día y noche', atNight: 'De noche', interior: 'Interior', dayNightAria: 'Ver el resort de día o de noche', atDay: 'de día', atNightCap: 'de noche',
      faq: 'Preguntas frecuentes', faqSub: 'Lo que más nos preguntan antes de reservar.', faqs: FAQ_ES,
      steps: ['Fechas', 'Personas', 'Camas', 'Tus datos', 'Confirmar'], stepOf: function (i, n) { return 'Paso ' + i + ' de ' + n; }, stepsDone: 'Todo listo: toca «Reservar»', video: 'Video', withSound: 'Toca para ver con sonido', photosN: function (n) { return n === 1 ? '1 foto' : n + ' fotos'; }, areas: ['Piscina', 'Zona de parrilla (BBQ)', 'Wood House', 'Mini zoo', 'Cancha de fútbol', 'Zona de billar', 'Área para niños', 'Jardines y fuentes'],
      depositRem: function (d) { return 'Depósito de garantía: ' + d + ', se paga al llegar.'; }, allPhotos: function (n) { return 'Ver las ' + n + ' fotos'; }, taxesIncl: 'impuestos incluidos', faqShort: 'Preguntas', langName: 'Español', summaryTitle: 'Tu reserva', backHome: 'Volver al inicio',
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
      deposit: 'Security deposit', depositAmount: 'Deposit amount', notInTotal: 'It is not included in the booking total.', depositNote: 'Paid on arrival and refunded within 24 hours after check-out, once the resort has been inspected.',
      idealFor: 'Perfect for', specialTitle: 'Special celebrations', eventsNote: 'These need prior approval from Lazurde. Please arrange it with us on WhatsApp after booking.', eventNeedsOk: 'This celebration needs prior approval from Lazurde. After booking, please arrange it with us on WhatsApp.',
      events: ['Family', 'Men’s gathering', 'Women’s gathering', 'Couples', 'Team gathering', 'Wedding', 'Engagement / Malka', 'Henna night', 'Birthday party', 'Graduation', 'Baby celebration', 'Other'],
      policies: 'Policies', cancellation: 'Cancellation', dateChange: 'Date change', refundTitle: 'Refunds', tbd: '[To be confirmed]',
      terms: 'Terms & conditions', termLine: function (i) { return i + '. [Term ' + i + ' — pending text. The official Lazurde Resort terms & conditions go here.]'; },
      showMore: 'Show more', footer: 'Lazurde Resort · Oman', privacy: 'Privacy policy', privacyNote: 'Read how we use your data in our privacy policy.', waOpen: 'WhatsApp will open with your request — just tap Send.',
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
      coupon: 'Discount code', couponPh: 'Enter your code', couponApply: 'Apply', couponBad: 'This code is not valid.', couponRemove: 'Remove', couponOk: function (p) { return p + '% off applied'; }, discountLine: function (c, p) { return 'Discount ' + c + ' (' + p + '%)'; }, rDiscount: function (c, p) { return 'Discount (' + p + '%)'; }, missing: 'Missing: ', mDates: 'dates', mGuests: 'confirm guests', mName: 'name', mPhone: 'valid phone', ccTitle: 'Country code', ccSearch: 'Search country or code', ccClose: 'Close', ccNone: 'No results', phoneOk: 'Valid number', phoneShort: function (n) { return n === 1 ? '1 more digit needed' : n + ' more digits needed'; }, phoneBad: function (c) { return 'This number is not valid in ' + c; }, phoneDigits: function (l) { return l + ' digits'; }, mTerms: 'accept the terms',
      barSub: function (n, r) { return n + (n === 1 ? ' night' : ' nights') + ' · ' + r + ' bedrooms'; }, pickDates: 'Choose your dates',
      sending: 'Sending…',
      sentTitle: 'Request received!', sentText: 'Your dates are on hold. We’ll review your request and confirm by WhatsApp very soon.', sentTextWa: 'Please send us the WhatsApp message that just opened to complete your request. We’ll confirm very soon.', waSend: 'Message us on WhatsApp', errTaken: 'Sorry, those dates were just booked. Please choose other dates.', errGeneric: 'We couldn’t send your request. Please check your connection and try again.',
      code: 'Booking code', example: ' (example)',
      rIn: 'Check-in', rOut: 'Check-out', rGuests: 'Guests', rRooms: 'Bedrooms', rPurpose: 'Purpose', rTotal: 'Total',
      guestsTxt: function (n) { return n + ' guests'; }, roomsTxt: function (r, k, t) { return r + ' (' + k + ' king · ' + t + ' twin)'; }, notGiven: 'Not specified',
      remember: 'Please note', remIn: 'Check-in: 2:00 pm', remOut: 'Check-out: 11:00 am', areasTitle: 'Explore the resort', areasSub: 'Swipe and tap an area to see all its photos.', day: 'Day', night: 'Night', dayNight: 'Day & night', atNight: 'At night', interior: 'Indoor', dayNightAria: 'See the resort by day or by night', atDay: 'by day', atNightCap: 'at night',
      faq: 'Frequently asked questions', faqSub: 'What guests ask us most before booking.', faqs: FAQ_EN,
      steps: ['Dates', 'Guests', 'Beds', 'Your details', 'Confirm'], stepOf: function (i, n) { return 'Step ' + i + ' of ' + n; }, stepsDone: 'All set: tap “Book”', video: 'Video', withSound: 'Tap to watch with sound', photosN: function (n) { return n === 1 ? '1 photo' : n + ' photos'; }, areas: ['Swimming pool', 'BBQ area', 'Wood House', 'Mini zoo', 'Football field', 'Billiards area', 'Kids area', 'Gardens & fountains'],
      depositRem: function (d) { return 'Security deposit: ' + d + ', paid on arrival.'; }, allPhotos: function (n) { return 'Show all ' + n + ' photos'; }, taxesIncl: 'taxes included', faqShort: 'FAQ', langName: 'English', summaryTitle: 'Your booking', backHome: 'Back to home',
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
      deposit: 'مبلغ التأمين', depositAmount: 'قيمة التأمين', notInTotal: 'غير مشمول في إجمالي الحجز.', depositNote: 'يُدفع عند الوصول ويُسترد خلال 24 ساعة بعد المغادرة، بعد معاينة المنتجع.',
      idealFor: 'مثالي لـ', specialTitle: 'المناسبات الخاصة', eventNeedsOk: 'تحتاج هذه المناسبة إلى موافقة مسبقة من لازورد. بعد الحجز، يرجى التنسيق معنا عبر واتساب.',
      eventsNote: 'تحتاج إلى موافقة مسبقة من لازورد. يرجى التنسيق معنا عبر واتساب بعد الحجز.', events: ['عائلة', 'تجمع رجال', 'تجمع نساء', 'أزواج', 'تجمع عمل', 'حفل زفاف', 'ملكة / خطوبة', 'ليلة الحناء', 'حفلة عيد ميلاد', 'حفل تخرج', 'احتفال بمولود', 'أخرى'],
      policies: 'السياسات', cancellation: 'الإلغاء', dateChange: 'تغيير التاريخ', refundTitle: 'استرداد المبالغ', tbd: '[سيتم تأكيده]',
      terms: 'الشروط والأحكام', termLine: function (i) { return i + '. [البند ' + i + ' — نص قيد الإعداد. هنا تُضاف الشروط والأحكام الرسمية لمنتجع لازورد.]'; },
      showMore: 'عرض المزيد', footer: 'منتجع لازورد · عُمان', privacy: 'سياسة الخصوصية', privacyNote: 'اطّلع على كيفية استخدامنا لبياناتك في سياسة الخصوصية.', waOpen: 'سيُفتح واتساب ومعه طلبك — فقط اضغط إرسال.',
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
      coupon: 'كود الخصم', couponPh: 'أدخل الكود', couponApply: 'تطبيق', couponBad: 'هذا الكود غير صحيح.', couponRemove: 'إزالة', couponOk: function (p) { return 'تم تطبيق خصم ' + p + '%'; }, discountLine: function (c, p) { return 'خصم ' + c + ' (' + p + '%)'; }, rDiscount: function (c, p) { return 'خصم (' + p + '%)'; }, missing: 'ينقص: ', mDates: 'التواريخ', mGuests: 'تأكيد عدد الضيوف', mName: 'الاسم', mPhone: 'رقم هاتف صحيح', ccTitle: 'رمز الدولة', ccSearch: 'ابحث عن الدولة أو الرمز', ccClose: 'إغلاق', ccNone: 'لا توجد نتائج', phoneOk: 'رقم صحيح', phoneShort: function (n) { return 'ينقص ' + n + ' أرقام'; }, phoneBad: function (c) { return 'هذا الرقم غير صحيح في ' + c; }, phoneDigits: function (l) { return l + ' أرقام'; }, mTerms: 'الموافقة على الشروط',
      barSub: function (n, r) { return arNights(n) + ' · ' + r + ' غرف'; }, pickDates: 'اختر التواريخ',
      sending: 'جارٍ الإرسال…',
      sentTitle: 'تم استلام طلبك!', sentText: 'تم حجز التواريخ مبدئيًا. سنراجع طلبك ونؤكده لك عبر واتساب قريبًا جدًا.', sentTextWa: 'يرجى إرسال رسالة واتساب التي فُتحت لإكمال طلبك، وسنؤكد لك قريبًا جدًا.', waSend: 'راسلنا عبر واتساب', errTaken: 'عذرًا، تم حجز هذه التواريخ للتو. يرجى اختيار تواريخ أخرى.', errGeneric: 'تعذّر إرسال طلبك. تحقّق من الاتصال وحاول مرة أخرى.',
      code: 'رمز الحجز', example: ' (مثال)',
      rIn: 'الوصول', rOut: 'المغادرة', rGuests: 'الضيوف', rRooms: 'الغرف', rPurpose: 'السبب', rTotal: 'الإجمالي',
      guestsTxt: arGuests, roomsTxt: function (r, k, t) { return r + ' (' + k + ' كينغ · ' + t + ' بسريرين)'; }, notGiven: 'غير محدد',
      remember: 'تذكير', remIn: 'الوصول: 2:00 م', remOut: 'المغادرة: 11:00 ص', areasTitle: 'تعرّف على المنتجع', areasSub: 'اسحب واضغط على أي منطقة لمشاهدة جميع صورها.', day: 'نهار', night: 'ليل', dayNight: 'نهارًا وليلًا', atNight: 'ليلًا', interior: 'داخلي', dayNightAria: 'شاهد المنتجع نهارًا أو ليلًا', atDay: 'نهارًا', atNightCap: 'ليلًا',
      faq: 'الأسئلة الشائعة', faqSub: 'أكثر ما يسألنا عنه الضيوف قبل الحجز.', faqs: FAQ_AR,
      steps: ['التواريخ', 'الضيوف', 'الأسرّة', 'بياناتك', 'التأكيد'], stepOf: function (i, n) { return 'الخطوة ' + i + ' من ' + n; }, stepsDone: 'كل شيء جاهز: اضغط «احجز»', video: 'فيديو', withSound: 'اضغط للمشاهدة مع الصوت', photosN: function (n) { return n === 1 ? 'صورة واحدة' : n + ' صور'; }, areas: ['المسبح', 'منطقة الشواء', 'البيت الخشبي', 'حديقة الحيوانات الصغيرة', 'ملعب كرة القدم', 'منطقة البلياردو', 'منطقة الأطفال', 'الحدائق والنوافير'],
      depositRem: function (d) { return 'مبلغ التأمين: ' + d + '، يُدفع عند الوصول.'; }, allPhotos: function (n) { return 'عرض الصور (' + n + ')'; }, taxesIncl: 'شامل الضرائب', faqShort: 'الأسئلة', langName: 'العربية', summaryTitle: 'حجزك', backHome: 'العودة إلى الرئيسية',
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
  // ===================== FOTOS Y VIDEOS =====================
  // Fotos en img/fotos/<nombre>-l.webp (grande) y -m.webp (mediana). Videos en video/.
  // Para cambiar el orden o los títulos, solo se edita esta lista.
  var HERO = [
    { video: 'recorrido', loop: 'recorrido-mudo', poster: 'h-1-vista-principal', t: { es: 'Video · Recorrido por el resort', en: 'Video · Resort tour', ar: 'فيديو · جولة في المنتجع' } },
    { img: 'h-2-area-de-piscina', t: { es: 'Patio de la piscina', en: 'Pool courtyard', ar: 'فناء المسبح' } },
    { img: 'h-8-wood-house', t: { es: 'Wood House', en: 'Wood House', ar: 'البيت الخشبي' } },
    { img: 'h-6-casa-principal', t: { es: 'Casa principal', en: 'Main house', ar: 'المبنى الرئيسي' } },
    { img: 'h-10-zona-de-billar', t: { es: 'Billar y juegos', en: 'Billiards & games', ar: 'البلياردو والألعاب' } },
    { img: 'h-3-area-de-bbq', t: { es: 'Zona BBQ', en: 'BBQ area', ar: 'منطقة الشواء' } },
    { img: 'h-5-fachada-principal', t: { es: 'Entrada principal', en: 'Main entrance', ar: 'المدخل الرئيسي' } },
    { img: 'h-4-area-de-piscina', t: { es: 'Zona de descanso', en: 'Lounge area', ar: 'منطقة الجلوس' } },
    { img: 'h-7-casa-principal-2', t: { es: 'Casa principal de noche', en: 'Main house at night', ar: 'المبنى الرئيسي ليلًا' } },
    { img: 'h-9-zona-de-parqueadero', t: { es: 'Parqueadero', en: 'Parking', ar: 'موقف السيارات' } }
  ];
  // p = fotos de día, n = fotos de noche (si la zona las tiene), interior = zona cubierta (no cambia de noche)
  var ZONES = [
    { video: 'resumen', loop: 'resumen-mudo', poster: 'resumen', t: { es: 'El resort en 13 segundos', en: 'The resort in 13 seconds', ar: 'المنتجع في 13 ثانية' } },
    { t: { es: 'Piscina', en: 'Swimming pool', ar: 'المسبح' }, p: ['v-22-zona-de-piscina-3', 'v-23-zona-de-piscina-4', 'v-24-zona-de-piscina-5', 'v-25-zona-de-piscina-6', 'h-2-area-de-piscina', 'h-4-area-de-piscina'], n: ['v-20-zona-de-piscina-1', 'v-21-zona-de-piscina-2'] },
    { t: { es: 'Llegada y casa principal', en: 'Arrival & main house', ar: 'المدخل والمبنى الرئيسي' }, p: ['v-31-entrada-principal', 'h-5-fachada-principal', 'v-33-casa-principal', 'v-32-casa-principal-2'], n: ['h-6-casa-principal', 'h-7-casa-principal-2'] },
    { t: { es: 'Sala principal', en: 'Main hall', ar: 'الصالة الرئيسية' }, p: ['v-38-sala-principal-1', 'v-39-sala-principal-2', 'v-40-sala-principal-3', 'v-37-interior'], interior: true },
    { t: { es: 'Sala de estar', en: 'Living room', ar: 'غرفة الجلوس' }, p: ['v-41-sala-de-estar-interior', 'v-42-sala-de-estar-interior-2'], interior: true },
    { t: { es: 'Cocina', en: 'Kitchen', ar: 'المطبخ' }, p: ['v-46-cocina-1', 'v-47-cocina-2', 'v-48-cocina-3', 'v-49-cocina-4'], interior: true },
    { t: { es: 'Wood House', en: 'Wood House', ar: 'البيت الخشبي' }, p: ['v-13-wood-house-interior-1', 'v-13-wood-house-interior-2', 'v-10-wood-house-fachada-1'], n: ['h-8-wood-house', 'v-11-wood-house-fachada-2', 'v-12-wood-house-fachada-3'] },
    { t: { es: 'Espacios abiertos', en: 'Outdoor spaces', ar: 'المساحات الخارجية' }, p: ['v-2-espacios-abiertos-2', 'v-1-espacios-abiertos', 'v-3-espacios-abiertos-3', 'v-4-espacios-abiertos-4', 'v-5-espacios-abiertos-5', 'v-6-espacios-abiertos-6', 'h-1-vista-principal'], n: ['v-7-espacios-abiertos-7', 'v-8-espacios-abiertos-8', 'v-9-espacios-abiertos-9'] },
    { t: { es: 'Zonas de descanso', en: 'Relaxation areas', ar: 'جلسات الاسترخاء' }, p: ['v-35-zona-de-relajacion-o-estar-trasera', 'v-34-zona-de-relajacion-o-estar-parte-frontal'], n: ['v-14-zona-de-estar-1', 'v-15-zona-de-estar-2', 'v-36-zona-de-relajacion-o-estar-fachada'] },
    { t: { es: 'Billar y juegos', en: 'Billiards & games', ar: 'البلياردو والألعاب' }, p: ['v-43-zona-de-billar-1', 'v-44-zona-de-billar-2', 'v-45-zona-de-billar-3', 'h-10-zona-de-billar'], interior: true },
    { t: { es: 'Zona BBQ', en: 'BBQ area', ar: 'منطقة الشواء' }, p: ['v-51-bbq-area-2', 'v-50-bbq-area-1', 'v-52-bbq-area-3', 'h-3-area-de-bbq'] },
    { t: { es: 'Cancha de fútbol', en: 'Football field', ar: 'ملعب كرة القدم' }, p: ['v-27-cancha-de-futbol-2'], n: ['v-26-cancha-de-futbol-1'] },
    { t: { es: 'Parque para niños', en: 'Kids playground', ar: 'ملعب الأطفال' }, p: ['v-19-parque-para-ninos-2'], n: ['v-18-parque-para-ninos-1'] },
    { t: { es: 'Mini zoo', en: 'Mini zoo', ar: 'حديقة الحيوانات الصغيرة' }, p: ['v-28-zona-de-animales'] },
    { t: { es: 'Jardines', en: 'Gardens', ar: 'الحدائق' }, p: ['v-17-jardines-2'], n: ['v-16-jardines-1'] },
    { t: { es: 'Parqueadero', en: 'Parking', ar: 'موقف السيارات' }, p: ['v-29-parqueadero-1', 'v-30-parqueadero-2'], n: ['h-9-zona-de-parqueadero'] }
  ];
  // Fotos de una zona según el modo elegido (de noche: primero las nocturnas y luego las de día)
  function zonePhotos(z, night) { return night && z.n ? z.n.concat(z.p) : (z.p || []).concat(z.n || []); }
  // En computador (pantalla ancha) la página usa su propio diseño a dos columnas
  var DESK = window.matchMedia('(min-width: 1024px)');
  function isDesk() { return DESK.matches; }
  function photo(slug, size) { return 'img/fotos/' + slug + '-' + (size || 'l') + '.webp'; }

  // Logo oficial de WhatsApp en un solo color (toma el color del texto del botón)
  function waIcon(w) { return '<svg width="' + (w || 20) + '" height="' + (w || 20) + '" viewBox="0 0 175.216 175.552" fill="currentColor" aria-hidden="true" style="flex:none"><path fill-rule="evenodd" d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"/><path d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/></svg>'; }
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
    screen: 'lang', lang: 'es', month: 0, gIdx: 0, liked: false, night: false, showAllFac: false, termsOpen: false,
    checkin: null, checkout: null, guests: CONFIG.baseGuests, confirmed: false, kings: CONFIG.maxKing,
    event: null, coupon: null, couponPct: 0, couponTry: '', couponErr: false, bookingCode: null, submitError: null, name: '', phone: '', cc: 'OM', ccOpen: false, email: '', termsOk: false, submitting: false
  };
  function set(patch) {
    var prevScreen = state.screen;
    for (var k in patch) state[k] = patch[k];
    render();
    if (patch.screen && patch.screen !== prevScreen) window.scrollTo(0, 0);
  }

  // ===================== MONEDA =====================
  // Si existe img/omr.svg (símbolo oficial del rial omaní) los precios salen con el símbolo antes del valor.
  // Si no existe, salen como antes: "240 OMR".
  var RIAL = false;
  function cur(num, T) {
    return RIAL ? '<span class="lz-rial" dir="ltr"><span class="lz-rial-s" role="img" aria-label="OMR"></span>' + num + '</span>' : num + T.unit;
  }
  fetch('img/omr.svg', { method: 'HEAD' }).then(function (r) {
    if (r.ok && (r.headers.get('content-type') || '').indexOf('svg') >= 0) { RIAL = true; render(); }
  }).catch(function () {});

  // ===================== CÁLCULOS =====================
  function calc() {
    var L = state.lang, T = DICT[L], rtl = L === 'ar';
    var money = function (n) { var r = Math.round(n * 100) / 100; return cur(r % 1 ? r.toFixed(2) : String(r), T); };
    var whole = function (n) { return cur(String(n), T); };
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
    // Descuento: se calcula en baisas (1 OMR = 1000 baisas) y se redondea a 10 baisas (0,01 OMR)
    var pct = state.coupon ? state.couponPct || 0 : 0;
    var subB = Math.round(subtotal * 1000);
    var discB = Math.round(subB * pct / 1000) * 10;
    var discount = discB / 1000, total = (subB - discB) / 1000;
    var net = total * 100 / (100 + CONFIG.tourismTax + CONFIG.vat);
    var taxAmt = net * CONFIG.tourismTax / 100, vatAmt = net * CONFIG.vat / 100;
    var taxLines = [];
    var priceLines = [];
    if (hasNights) {
      priceLines.push({ label: T.stayLine(nights), amount: money(roomTotal) });
      if (extra > 0) priceLines.push({ label: T.extraLine(extra, nights), amount: money(extraTotal) });
      if (discB > 0) priceLines.push({ label: T.discountLine(state.coupon, pct), amount: '−' + money(discount), green: true });
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
    if (phoneCheck(state.cc, state.phone).status !== 'ok') missing.push(T.mPhone);
    if (!state.termsOk) missing.push(T.mTerms);

    return {
      L: L, T: T, rtl: rtl, money: money, whole: whole, fmt: fmt, todayKey: todayKey,
      y: y, m: m, first: first, dim: dim,
      nightRows: nightRows, nights: nights, hasNights: hasNights, rooms: rooms, extra: extra,
      priceLines: priceLines, taxLines: taxLines, total: total, subtotal: subtotal, discount: discount, pct: pct, kMin: kMin, kMax: kMax, kings: kings, twins: twins,
      missing: missing, canSubmit: missing.length === 0 && !state.submitting
    };
  }

  // ===================== ANIMACIÓN DE LA PIEDRA =====================
  // Las piezas aparecen suavemente de arriba hacia abajo, la piedra completa se
  // desvanece y se vuelve a armar. Con loop=false se arma 2 veces y queda armada.
  var STONE_SVG = document.querySelector('#splash svg').outerHTML.replace(/lzg/g, 'lzg2').replace(/ class="[^"]*"/, '');
  function stoneLoop(svg, loop, cycles) {
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
      if (loop || count < (cycles || 2)) {
        timers.push(setTimeout(function () { svg.classList.add('out'); }, 2050));
        timers.push(setTimeout(cycle, 2600));
      }
    }
    cycle();
    return function () { timers.forEach(clearTimeout); };
  }

  // ===================== TELÉFONO: TODOS LOS PAÍSES =====================
  // phones.json sale del archivo oficial de Google (libphonenumber):
  // [país, indicativo, prefijo nacional, patrón válido, cantidades de dígitos posibles, ejemplo]
  var PHONES = [['OM', '968', '', '(?:[279]\\d{7})', [8], '92123456']], PHONE_BY = {};
  function indexPhones() { PHONE_BY = {}; PHONES.forEach(function (p) { PHONE_BY[p[0]] = p; }); }
  indexPhones();
  fetch('phones.json').then(function (r) { return r.json(); }).then(function (d) { PHONES = d; indexPhones(); if (state.screen === 'book') render(); }).catch(function () {});
  // Configuración y fechas ocupadas desde el servidor
  var API = { enabled: false }, APPVER = null;
  var UPD = { es: 'Hay una versión nueva', en: 'A new version is available', ar: 'يتوفر إصدار جديد' }, UPDB = { es: 'Actualizar', en: 'Update', ar: 'تحديث' };
  function showUpdate() {
    if (document.getElementById('lz-update')) return;
    // Si la página está en segundo plano se actualiza sola; si la están usando, se avisa con un botón
    if (document.hidden) { location.reload(); return; }
    var l = UPD[state.lang] ? state.lang : 'en', el = document.createElement('button');
    el.id = 'lz-update'; el.type = 'button';
    el.innerHTML = '<span>' + UPD[l] + '</span><b>' + UPDB[l] + '</b>';
    el.addEventListener('click', function () { location.reload(); });
    document.body.appendChild(el);
  }
  function loadConfig(silent) {
    return fetch('/api/config', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) return;
      for (var k in d.config) CONFIG[k] = d.config[k];
      var before = JSON.stringify(CONFIG.booked);
      CONFIG.booked = d.unavailable || [];
      API.enabled = !!d.bookingsEnabled;
      // ¿Se publicó una versión nueva mientras la página estaba abierta?
      if (d.version) { if (!APPVER) APPVER = d.version; else if (d.version !== APPVER) showUpdate(); }
      if (silent && before === JSON.stringify(CONFIG.booked)) return;
      var ae = document.activeElement;
      if (silent && ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      if (state.screen === 'home' || state.screen === 'book') render();
    }).catch(function () {});
  }
  var PINNED = ['OM', 'AE', 'SA', 'QA', 'KW', 'BH'];
  // Banderas como imagen: en Windows los emojis de banderas salen como letras (OM, CO…)
  function flag(iso) { return '<img class="lzflag" src="/booking/img/flags/' + iso.toLowerCase() + '.webp" alt="" width="24" height="18" loading="lazy">'; }
  var nameCache = {};
  function countryName(iso) {
    var k = state.lang + iso;
    if (!nameCache[k]) { try { nameCache[k] = new Intl.DisplayNames([state.lang], { type: 'region' }).of(iso) || iso; } catch (e) { nameCache[k] = iso; } }
    return nameCache[k];
  }
  function phoneCheck(iso, raw) {
    var p = PHONE_BY[iso] || PHONE_BY.OM, d = String(raw || '').replace(/\D/g, '');
    if (p[2] && d.indexOf(p[2]) === 0 && p[4].indexOf(d.length - p[2].length) >= 0) d = d.slice(p[2].length);
    var min = p[4][0], max = p[4][p[4].length - 1];
    if (!d) return { status: 'empty', digits: d, min: min, max: max };
    if (d.length < min) return { status: 'short', need: min - d.length, digits: d, min: min, max: max };
    var ok = p[4].indexOf(d.length) >= 0 && new RegExp('^(?:' + p[3] + ')$').test(d);
    return { status: ok ? 'ok' : 'bad', digits: d, min: min, max: max };
  }
  function phoneMsg(T) {
    var ck = phoneCheck(state.cc, state.phone);
    if (ck.status === 'ok') return '<span style="color:#15803D">✓ ' + T.phoneOk + ' · +' + PHONE_BY[state.cc][1] + ' ' + ck.digits + '</span>';
    if (ck.status === 'short') return '<span class="muted">' + T.phoneShort(ck.need) + '</span>';
    if (ck.status === 'bad') return '<span style="color:#B42318">' + T.phoneBad(countryName(state.cc)) + '</span>';
    var p = PHONE_BY[state.cc];
    return '<span class="muted">' + T.phoneDigits(p[4].length > 1 ? p[4][0] + '–' + p[4][p[4].length - 1] : p[4][0]) + '</span>';
  }
  function tplPhone(c) {
    var T = c.T, p = PHONE_BY[state.cc] || PHONE_BY.OM, max = p[4][p[4].length - 1] + (p[2] ? p[2].length : 0);
    return '<div dir="ltr" style="display:flex;gap:8px"><button type="button" class="lz-cc" data-act="ccOpen" aria-label="' + T.ccTitle + ': ' + esc(countryName(p[0])) + ' +' + p[1] + '">' +
      '<span style="font-size:20px;line-height:1">' + flag(p[0]) + '</span><span>+' + p[1] + '</span>' + svg(ICON.down || 'M6 9l6 6 6-6', { w: 14, sw: 2 }) + '</button>' +
      '<input id="lz-phone" class="field" type="tel" inputmode="numeric" autocomplete="tel-national" data-field="phone" maxlength="' + (max + 4) + '" value="' + esc(state.phone) + '" placeholder="' + esc(p[5]) + '" style="flex:1;min-width:0"></div>' +
      '<p id="lz-phone-msg" aria-live="polite" style="font-size:12px;margin-top:-4px">' + phoneMsg(T) + '</p>';
  }
  function ccRows(T, q) {
    var norm = function (t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    q = norm((q || '').trim()).replace(/^\+/, '');
    var list = PHONES.slice().sort(function (a, b) { return countryName(a[0]).localeCompare(countryName(b[0]), state.lang); });
    if (q) list = list.filter(function (p) { return norm(countryName(p[0])).indexOf(q) >= 0 || p[1].indexOf(q) === 0 || p[0].toLowerCase() === q; });
    else list = PINNED.map(function (k) { return PHONE_BY[k]; }).filter(Boolean).concat([null], list);
    if (!list.length) return '<p class="muted" style="padding:20px;text-align:center">' + T.ccNone + '</p>';
    return list.map(function (p) {
      if (!p) return '<div style="height:1px;background:#E3E8EE;margin:6px 0"></div>';
      return '<button type="button" class="lz-cc-row" data-act="ccPick" data-arg="' + p[0] + '"' + (p[0] === state.cc ? ' aria-current="true"' : '') + '><span style="font-size:22px;line-height:1">' + flag(p[0]) + '</span><span style="flex:1">' + esc(countryName(p[0])) + '</span><strong dir="ltr">+' + p[1] + '</strong></button>';
    }).join('');
  }
  // Mientras la lista de países está abierta, la página de atrás queda quieta (iPhone)
  var lockedY = 0;
  function lockPage(on) {
    var b = document.body;
    if (on && !b.classList.contains('lz-lock')) { lockedY = window.scrollY; b.style.top = -lockedY + 'px'; b.classList.add('lz-lock'); }
    else if (!on && b.classList.contains('lz-lock')) { b.classList.remove('lz-lock'); b.style.top = ''; window.scrollTo(0, lockedY); }
  }
  function tplCcSheet(T) {
    return '<div class="lz-sheet-bg" data-act="ccClose"></div><div class="lz-sheet" role="dialog" aria-modal="true" aria-label="' + T.ccTitle + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px"><strong style="font-size:17px">' + T.ccTitle + '</strong><button type="button" class="icon-btn" data-act="ccClose" aria-label="' + T.ccClose + '">✕</button></div>' +
      '<div style="padding:0 18px 10px"><input id="lz-ccq" class="field" type="search" data-field="ccq" placeholder="' + T.ccSearch + '" autocomplete="off"></div>' +
      '<div id="lz-cc-list" class="lz-cc-list">' + ccRows(T, '') + '</div></div>';
  }

  // ===================== PLANTILLAS =====================
  function tplLang() {
    var langs = [
      ['ar', 'ع', 'العربية', 'المتابعة باللغة العربية', 'rtl'],
      ['en', 'EN', 'English', 'Continue in English', 'ltr'],
      ['es', 'ES', 'Español', 'Continuar en español', 'ltr']
    ];
    return '<div class="lz-lang" dir="ltr">' +
      '<img class="lz-lang-wm" src="img/stone.svg" alt="" aria-hidden="true">' +
      '<div class="lz-lang-box">' +
      '<span class="lz-lang-glow"><img class="lz-lang-stone" src="img/stone.svg" alt="Lazurde"></span>' +
      '<p class="lz-lang-hello" dir="ltr"><span class="lz-h-l">Welcome ·</span><bdi lang="ar">أهلاً بك</bdi><span class="lz-h-r">· Bienvenido</span></p>' +
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
      var cls = 'cell', label = cur(String(incl(price)), { unit: '' }), dis = false, labelColor = pc;
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

  // Depósito de garantía: cuadro con el monto y debajo para qué es
  function tplDeposit(c, inBooking) {
    var T = c.T, li = function (t) { return '<li style="display:flex;gap:10px;align-items:flex-start"><span style="width:6px;height:6px;border-radius:999px;background:#D3AE2A;flex:none;margin-top:9px"></span><span>' + t + '</span></li>'; };
    return '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:14px"><h2 class="h2">' + T.deposit + '</h2>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#F5F7FA;border:1px solid #E9EDF2;border-radius:16px;padding:18px">' +
      '<span style="font-size:16px;font-weight:700">' + T.depositAmount + '</span><strong style="font-size:22px;font-weight:800;color:#0B2E4F">' + c.whole(CONFIG.deposit) + '</strong></div>' +
      '<ul style="list-style:none;margin:0;padding:0 2px;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.6;color:#3D4A58">' + li(T.depositNote) + (inBooking ? li(T.notInTotal) : '') + '</ul></section>';
  }

  // Cupón de descuento
  function tplCoupon(c) {
    var T = c.T;
    if (state.coupon) {
      return '<div class="lz-coupon-ok"><span style="display:flex;align-items:center;gap:8px"><span class="lz-coupon-tag">' + esc(state.coupon) + '</span>' + T.couponOk(c.pct) + '</span>' +
        '<button type="button" data-act="couponRemove" class="lz-coupon-x">' + T.couponRemove + '</button></div>';
    }
    return '<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px"><label for="lz-coupon" class="label">' + T.coupon + '</label>' +
      '<div style="display:flex;gap:8px"><input id="lz-coupon" class="field" type="text" data-field="couponTry" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(state.couponTry) + '" placeholder="' + T.couponPh + '" style="flex:1;min-width:0;text-transform:uppercase' + (state.couponErr ? ';border-color:#B42318' : '') + '">' +
      '<button type="button" class="lz-coupon-btn" data-act="couponApply">' + T.couponApply + '</button></div>' +
      (state.couponErr ? '<p style="font-size:12px;color:#B42318">' + T.couponBad + '</p>' : '') + '</div>';
  }

  function contactBtn(href, colors, inner) {
    var st = 'flex:1;height:48px;border-radius:14px;border:0;' + colors + ';display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none';
    return href ? '<a href="' + href + '" target="_blank" rel="noopener" style="' + st + '">' + inner + '</a>' : '<button type="button" style="' + st + '">' + inner + '</button>';
  }

  // Mensaje de WhatsApp con la reserva (siempre en inglés para el equipo del resort)
  function bookingMessage(c) {
    var E = DICT.en, f = function (k) { var p = k.split('-').map(Number); return E.fmt(dow(k), p[2], p[1] - 1) + ', ' + p[0]; };
    var lines = [
      'New booking request – Lazurde Resort' + (state.bookingCode ? ' · ' + state.bookingCode : ''),
      '',
      'Check-in: ' + f(state.checkin) + ' (2:00 pm)',
      'Check-out: ' + f(state.checkout) + ' (11:00 am)',
      'Nights: ' + c.nights,
      'Guests: ' + state.guests + ' · Bedrooms: ' + c.rooms + ' (' + c.kings + ' king, ' + c.twins + ' twin)',
      'Purpose: ' + (state.event === null ? 'Not specified' : E.events[state.event]),
      'Total: ' + (Math.round(c.total * 100) / 100) + ' OMR (taxes included)' + (c.discount > 0 ? ' – coupon ' + state.coupon + ' (' + c.pct + '%, −' + (Math.round(c.discount * 100) / 100) + ' OMR)' : ''),
      'Security deposit on arrival: ' + CONFIG.deposit + ' OMR',
      '',
      'Name: ' + state.name.trim(),
      'Phone: +' + (PHONE_BY[state.cc] || PHONE_BY.OM)[1] + ' ' + phoneCheck(state.cc, state.phone).digits,
      'Email: ' + (state.email.trim() || '-'),
      'Language: ' + ({ ar: 'Arabic', en: 'English', es: 'Spanish' })[state.lang]
    ];
    return lines.join('\n');
  }

  function tplGallery(c) {
    var T = c.T, n = HERO.length, gi = ((state.gIdx % n) + n) % n, h = HERO[gi], nx = HERO[(gi + 1) % n];
    var img = photo(h.img || h.poster);
    try { new Image().src = photo(nx.img || nx.poster); } catch (e) {}
    return '<div id="lz-top" class="lz-gal" style="position:relative;height:300px;background:#0B2E4F">' +
      '<button type="button" class="lz-hero-img" data-act="heroOpen" aria-label="' + esc(h.t[c.L]) + '">' + (h.loop
        ? '<video src="video/' + h.loop + '.mp4" poster="' + img + '"' + (holdHero ? '' : ' autoplay') + ' muted loop playsinline preload="auto" aria-hidden="true"></video>'
        : '<img src="' + img + '" alt="' + esc(h.t[c.L]) + '">') + '</button>' +
      '<span class="lz-hero-cap">' + h.t[c.L] + '</span>' +
      (h.video ? '<span aria-hidden="true" class="lz-sound">' + T.withSound + '</span>' : '') +
      '<button type="button" class="icon-btn" data-act="gPrev" aria-label="' + T.prevPhoto + '" style="position:absolute;inset-inline-start:10px;top:128px;border:0;background:rgba(255,255,255,.85)">' + svg(c.rtl ? ICON.right : ICON.left, { w: 20, sw: 2 }) + '</button>' +
      '<button type="button" class="icon-btn" data-act="gNext" aria-label="' + T.nextPhoto + '" style="position:absolute;inset-inline-end:10px;top:128px;border:0;background:rgba(255,255,255,.85)">' + svg(c.rtl ? ICON.left : ICON.right, { w: 20, sw: 2 }) + '</button>' +
      '<span style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;white-space:nowrap;pointer-events:none">' + T.of(gi + 1, n) + '</span>' +
      '<div style="position:absolute;inset-inline-end:12px;bottom:10px;display:flex;gap:8px">' +
      '<button type="button" class="icon-btn" data-act="like" aria-label="' + T.fav + '" aria-pressed="' + state.liked + '" style="border:0">' + svg(ICON.heart, { w: 20, fill: state.liked ? '#D9364F' : 'none', stroke: state.liked ? '#D9364F' : '#0B2E4F' }) + '</button>' +
      '<button type="button" class="icon-btn" data-act="share" aria-label="' + T.share + '" style="border:0">' + svg(ICON.share, { w: 20 }) + '</button></div></div>';
  }

  // Computador: mosaico de fotos (1 grande con el video + 4), cada una abre el visor
  function tplDeskGallery(c) {
    var T = c.T, h = HERO[0], img = photo(h.poster), thumbs = HERO.slice(1, 5);
    return '<div id="lz-top" class="lz-dhero">' +
      '<button type="button" class="lz-dhero-v" data-act="heroAt" data-arg="0" aria-label="' + esc(h.t[c.L]) + '"><video src="video/' + h.loop + '.mp4" poster="' + img + '"' + (holdHero ? '' : ' autoplay') + ' muted loop playsinline preload="auto" aria-hidden="true"></video></button>' +
      '<div class="lz-dhero-shade" aria-hidden="true"></div>' +
      '<div class="lz-dhero-txt"><span class="lz-dhero-k">' + T.badge + ' · Oman</span><h1>' + T.resortName + '</h1><p>' + T.specs.slice(0, 3).join(' · ') + '</p>' +
      '<button type="button" class="lz-dhero-play" data-act="heroAt" data-arg="0"><span class="lz-dhero-pi"></span>' + T.withSound + '</button></div>' +
      '<div class="lz-dhero-th">' + thumbs.map(function (t, i) { return '<button type="button" data-act="heroAt" data-arg="' + (i + 1) + '" aria-label="' + esc(t.t[c.L]) + '"><img src="' + photo(t.img, 'm') + '" alt="" loading="lazy"></button>'; }).join('') +
      '<button type="button" class="lz-dhero-all" data-act="heroAt" data-arg="1">' + svg('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', { w: 16, sw: 2 }) + T.allPhotos(HERO.length) + '</button></div></div>';
  }
  // Computador: tarjeta de reserva fija a la derecha
  function tplDeskSide(c) {
    var T = c.T;
    return '<aside class="lz-side"><div class="lz-side-card">' +
      '<span class="muted" style="font-size:13px">' + T.from + '</span>' +
      '<div style="display:flex;align-items:baseline;gap:6px;margin-top:2px"><strong style="font-size:30px;font-weight:800">' + c.whole(incl(CONFIG.weekdayPrice)) + '</strong><span class="muted" style="font-size:15px;font-weight:600">' + T.perNight + '</span></div>' +
      '<span class="muted" style="font-size:13px">' + T.baseInfo + ' · ' + T.taxesIncl + '</span>' +
      '<div class="lz-side-times"><div><span>' + T.checkIn + '</span><strong>' + T.checkInTime + '</strong></div><div><span>' + T.checkOut + '</span><strong>' + T.checkOutTime + '</strong></div></div>' +
      '<button type="button" class="btn-primary" data-act="goBook" style="width:100%;height:54px;font-size:17px">' + T.bookNow + '</button>' +
      '<p class="muted" style="font-size:12.5px;line-height:1.5;text-align:center;margin-top:10px">' + T.depositRem(c.whole(CONFIG.deposit)) + '</p>' +
      '<div style="display:flex;gap:8px;margin-top:14px">' +
      contactBtn(CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp : '', 'background:#E7F5EC;color:#14532D', waIcon(19) + T.whatsapp) +
      contactBtn(CONFIG.phone ? 'tel:' + CONFIG.phone : '', 'background:#EAF1F8;color:#0F4C81', svg(ICON.phone, { w: 18 }) + T.call) + '</div></div></aside>';
  }
  // Computador: barra de arriba con menú
  function tplDeskHeader(c, book) {
    var T = c.T;
    return '<header class="fixed-top lz-dhead"><div class="lz-dhead-in">' +
      (book ? '<button type="button" class="icon-btn" data-act="goHome" aria-label="' + T.back + '" style="border:0">' + svg(c.rtl ? ICON.backR : ICON.backL, { sw: 2 }) + '</button>' : '') +
      '<img src="img/wordmark.svg" alt="Lazurde" style="height:28px;width:auto">' +
      (book ? '<span class="lz-dhead-t">' + T.confirmTitle + '</span>' :
      '<nav class="lz-dnav" aria-label="' + T.navAria + '"><a href="#lz-areas">' + T.areasTitle + '</a><a href="#lz-cal">' + T.availability + '</a><a href="#lz-rooms">' + T.rooms + '</a><a href="#lz-faq">' + T.faqShort + '</a><a href="' + (CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp : '#lz-faq') + '" target="_blank" rel="noopener">' + T.navContact + '</a></nav>') +
      '<div class="lz-dhead-r"><button type="button" class="lz-dlang" data-act="openLang">' + svg(ICON.globe, { w: 18, sw: 1.7 }) + T.langName + '</button>' +
      (CONFIG.whatsapp ? '<a class="icon-btn" href="https://wa.me/' + CONFIG.whatsapp + '" target="_blank" rel="noopener" aria-label="' + T.waAria + '" style="color:#25D366">' + waIcon(21) + '</a>' : '') +
      (book ? '' : '<button type="button" class="btn-primary" data-act="goBook" style="height:44px;padding:0 22px;font-size:15px">' + T.bookNow + '</button>') + '</div></div></header>';
  }
  // Zonas del resort: una fila de tarjetas; al tocar una se abren todas sus fotos
  // La fila es un círculo: se pinta 3 veces (copia · original · copia) y al terminar de
  // deslizar se salta sin que se note a la misma tarjeta de la tanda del medio.
  var SUN_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  var MOON_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/></svg>';
  // Cielo nocturno: estrellas que titilan (posiciones fijas para que no cambien al redibujar) y un cometa
  var STARS = (function () { var a = [], x = 7; for (var i = 0; i < 34; i++) { x = (x * 48271) % 2147483647; var l = x / 2147483647; x = (x * 48271) % 2147483647; var t = x / 2147483647; x = (x * 48271) % 2147483647; a.push([Math.round(2 + l * 96), Math.round(3 + t * 90), (x / 2147483647).toFixed(2)]); } return a; })();
  function tplSky() {
    return '<div class="lz-sky" aria-hidden="true">' + STARS.map(function (st, i) { return '<i style="left:' + st[0] + '%;top:' + st[1] + '%;animation-delay:' + (-st[2] * 4) + 's;animation-duration:' + (2.6 + st[2] * 2.4).toFixed(1) + 's' + (i % 5 === 0 ? ';width:3px;height:3px' : '') + (i % 7 === 0 ? ';background:#FAD26D' : '') + '"></i>'; }).join('') + '</div>';
  }
  function dnSwitch(T, cls) {
    return '<div class="' + cls + '" role="group" aria-label="' + T.dayNightAria + '"><span class="lz-dn-thumb"></span>' +
      '<button type="button" data-act="dayNight" data-arg="0" aria-pressed="' + !state.night + '">' + SUN_ICON + T.day + '</button>' +
      '<button type="button" data-act="dayNight" data-arg="1" aria-pressed="' + state.night + '">' + MOON_ICON + T.night + '</button></div>';
  }
  function tplAreas(c) {
    var T = c.T;
    function card(z, i, copy) {
      var media = z.video
        ? (copy ? '<img class="lz-area-media" src="video/' + z.poster + '.webp" alt="" loading="lazy">'
                : '<video class="lz-area-media" src="video/' + z.loop + '.mp4" poster="video/' + z.poster + '.webp" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>')
        : '<img class="lz-area-media" src="' + photo(z.p[0]) + '" alt="" loading="lazy">' + (z.n ? '<img class="lz-area-media lz-area-n" src="' + photo(z.n[0]) + '" alt="" loading="lazy">' : '');
      var n = z.video ? 0 : zonePhotos(z).length;
      var tag = z.video ? '▶ ' + T.video : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>' + T.photosN(n);
      var badge = z.n ? '<span class="lz-dn-badge">' + MOON_ICON + '<span class="lz-dn-bt">' + (state.night ? T.atNight : T.dayNight) + '</span></span>' : (z.interior ? '<span class="lz-dn-int">' + T.interior + '</span>' : '');
      return '<button type="button" class="lz-area" data-act="zoneOpen" data-arg="' + i + '" aria-label="' + esc(z.t[c.L]) + '"' + (copy ? ' aria-hidden="true" tabindex="-1" data-copy="1"' : '') + '>' + media + badge +
        '<span class="lz-area-tag">' + tag + '</span>' +
        '<span class="lz-area-cap" dir="' + (c.rtl ? 'rtl' : 'ltr') + '"><span class="lz-area-n">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span class="lz-area-name">' + z.t[c.L] + '</span></span></button>';
    }
    var set = function (copy) { return ZONES.map(function (z, i) { return card(z, i, copy); }).join(''); };
    return '<div class="gap8"></div><section id="lz-areas" class="card lz-dn' + (state.night ? ' night' : '') + '" style="padding:20px 0 18px">' + tplSky() +
      '<div style="padding:0 18px;position:relative"><h2 class="h2">' + T.areasTitle + '</h2><p class="muted" style="font-size:13px;margin-top:4px">' + T.areasSub + '</p>' + dnSwitch(T, 'lz-dn-sw') + '</div>' +
      '<div class="lz-areas-wrap"><div class="lz-areas" dir="ltr">' + set(true) + set(false) + set(true) + '</div>' +
      '<button type="button" class="lz-areas-arrow lz-prev" data-act="areasStep" data-arg="-1" aria-label="' + T.prevPhoto + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="lz-areas-arrow lz-next" data-act="areasStep" data-arg="1" aria-label="' + T.nextPhoto + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button></div></section>';
  }
  // Cambia entre día y noche sin redibujar la página (así la fila de zonas no salta)
  function applyDayNight() {
    var T = DICT[state.lang], sec = document.getElementById('lz-areas');
    if (!sec) return;
    sec.classList.toggle('night', state.night);
    sec.querySelectorAll('[data-act=dayNight]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-arg') === '1') === state.night)); });
    sec.querySelectorAll('.lz-dn-bt').forEach(function (b) { b.textContent = state.night ? T.atNight : T.dayNight; });
  }
  function initAreasLoop() {
    var row = document.querySelector('.lz-areas');
    if (!row || row._loop) return;
    row._loop = true;
    var n = ZONES.length;
    function setW() { return row.children[n].offsetLeft - row.children[0].offsetLeft; }
    function jump(to) {
      row.style.scrollSnapType = 'none'; row.scrollLeft = to; void row.offsetWidth; row.style.scrollSnapType = '';
    }
    jump(row.children[n].offsetLeft - 18);          // empieza en la tarjeta 01 de la tanda del medio, pegada a la izquierda
    var t = null;
    row.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var w = setW(), x = row.scrollLeft;
        if (x < w * 0.5) jump(x + w); else if (x >= w * 1.5) jump(x - w);
      }, 140);
    }, { passive: true });
  }

  // Visor a pantalla completa (fotos y videos), se desliza con el dedo
  var viewerEl = null;
  function openViewer(items, start, title, zone) {
    var T = DICT[state.lang];
    closeViewer();
    lockPage(true);
    viewerEl = document.createElement('div');
    viewerEl.className = 'lz-viewer';
    viewerEl.setAttribute('role', 'dialog'); viewerEl.setAttribute('aria-modal', 'true'); viewerEl.setAttribute('aria-label', title);
    viewerEl.innerHTML = '<div class="lz-v-top"><button type="button" class="lz-v-btn" data-v="close" aria-label="' + T.ccClose + '">✕</button><strong>' + esc(title) + '</strong><span class="lz-v-count"></span></div>' +
      '<div class="lz-v-track" dir="ltr">' + items.map(function (it) {
        return '<div class="lz-v-slide">' + (it.video
          ? '<video src="video/' + it.video + '.mp4" poster="' + (it.poster.indexOf('/') >= 0 ? it.poster : (it.poster.charAt(1) === '-' ? photo(it.poster) : 'video/' + it.poster + '.webp')) + '" controls playsinline preload="metadata"></video>'
          : '<img src="' + photo(it.img) + '" alt="' + esc(it.cap || title) + '" loading="lazy">') + '</div>';
      }).join('') + '</div>' +
      (items.length > 1 ? '<button type="button" class="lz-v-btn lz-v-prev" data-v="prev" aria-label="' + T.prevPhoto + '">‹</button><button type="button" class="lz-v-btn lz-v-next" data-v="next" aria-label="' + T.nextPhoto + '">›</button>' : '') +
      (zone && zone.n ? '<div class="lz-dn-vsw' + (state.night ? ' night' : '') + '" role="group" aria-label="' + T.dayNightAria + '"><span class="lz-dn-thumb"></span>' +
        '<button type="button" data-v="day" aria-pressed="' + !state.night + '">' + SUN_ICON + T.day + '<small>' + zone.p.length + '</small></button>' +
        '<button type="button" data-v="night" aria-pressed="' + state.night + '">' + MOON_ICON + T.night + '<small>' + zone.n.length + '</small></button></div>' : '');
    document.body.appendChild(viewerEl);
    var track = viewerEl.querySelector('.lz-v-track'), count = viewerEl.querySelector('.lz-v-count');
    function cur() { return Math.round(track.scrollLeft / track.clientWidth); }
    function update() {
      var k = cur(); count.textContent = items.length > 1 ? (k + 1) + ' / ' + items.length : '';
      if (items[k] && items[k].cap) viewerEl.querySelector('.lz-v-top strong').textContent = items[k].cap;
      track.querySelectorAll('video').forEach(function (v, i) { if (v.closest('.lz-v-slide') !== track.children[k]) v.pause(); });
    }
    track.scrollLeft = start * track.clientWidth; update();
    var first = track.children[start] && track.children[start].querySelector('video');
    if (first) { var p = first.play(); if (p && p.catch) p.catch(function () {}); }
    track.addEventListener('scroll', function () { clearTimeout(track._t); track._t = setTimeout(update, 80); });
    viewerEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b) return;
      var v = b.getAttribute('data-v');
      if (v === 'close') closeViewer();
      else if (v === 'day' || v === 'night') { if ((v === 'night') !== state.night) { state.night = v === 'night'; applyDayNight(); actions.zoneOpen(zone.idx); } }
      else track.scrollTo({ left: (cur() + (v === 'next' ? 1 : -1)) * track.clientWidth, behavior: 'smooth' });
    });
  }
  function closeViewer() {
    if (!viewerEl) return;
    viewerEl.querySelectorAll('video').forEach(function (v) { v.pause(); });
    viewerEl.remove(); viewerEl = null; lockPage(false); galLast = Date.now();
  }
  document.addEventListener('keydown', function (e) {
    if (!viewerEl) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var b = viewerEl.querySelector(e.key === 'ArrowRight' ? '.lz-v-next' : '.lz-v-prev'); if (b) b.click(); }
  });

  function tplHome(c) {
    var T = c.T;
    var fac = T.fac.map(function (lb, i) { return { label: lb, d: FAC_ICONS[i] }; });
    var facShown = state.showAllFac ? fac : fac.slice(0, 5);
    var h = '', desk = isDesk();
    // Barra superior
    if (desk) h += tplDeskHeader(c, false); else h += '<header class="fixed-top" style="height:60px;background:#fff;border-bottom:1px solid #E3E8EE;display:flex;align-items:center;justify-content:space-between;padding:0 10px">' +
      '<button type="button" class="icon-btn" data-act="openLang" aria-label="' + T.changeLang + '">' + svg(ICON.globe, { sw: 1.7 }) + '</button>' +
      '<img src="img/wordmark.svg" alt="Lazurde" style="height:26px;width:auto">' +
      (CONFIG.whatsapp ? '<a class="icon-btn" href="https://wa.me/' + CONFIG.whatsapp + '" target="_blank" rel="noopener" aria-label="' + T.waAria + '" style="color:#25D366">' + waIcon(21) + '</a>'
        : '<button type="button" class="icon-btn" aria-label="' + T.waAria + '" style="color:#25D366">' + waIcon(21) + '</button>') + '</header>';
    h += desk ? '<main class="lz-dmain">' : '<main style="padding-top:calc(60px + env(safe-area-inset-top));padding-bottom:calc(190px + env(safe-area-inset-bottom))">';
    // Galería
    h += desk ? tplDeskGallery(c) + '<div class="lz-dgrid"><div class="lz-dcol">' : tplGallery(c);
    // Título
    h += '<div style="background:#fff;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><h1 style="font-size:24px;font-weight:800;line-height:1.25">' + T.resortName + '</h1>' +
      '<span style="flex:none;background:#EAF1F8;color:#0F4C81;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px">' + T.badge + '</span></div>' +
      '<span style="font-size:14px;color:#5A6573;display:flex;align-items:center;gap:6px">' + svg(ICON.pin, { w: 16 }) + T.location + '</span>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' + T.specs.map(function (s) { return '<span style="background:#F5F7FA;border:1px solid #E3E8EE;border-radius:999px;padding:6px 11px;font-size:13px;font-weight:600">' + s + '</span>'; }).join('') + '</div>' +
      '<span style="font-size:12px;color:#5A6573">' + T.license + '</span></div>';
    // Contacto
    h += '<div id="lz-contact" style="background:#fff;padding:0 18px 18px;display:flex;gap:10px">' +
      contactBtn(CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp : '', 'background:#E7F5EC;color:#14532D', waIcon(20) + T.whatsapp) +
      contactBtn(CONFIG.phone ? 'tel:' + CONFIG.phone : '', 'background:#EAF1F8;color:#0F4C81', svg(ICON.phone, { w: 20 }) + T.call) + '</div>';
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
    h += '<div class="gap8"></div><section id="lz-rooms" class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.rooms + '</h2>' +
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
    h += tplDeposit(c, false);
    // Ideal para (grupos normales) y celebraciones especiales (necesitan autorización)
    var evItem = function (e, gold) { return '<span style="display:flex;align-items:center;gap:8px;background:' + (gold ? '#FFFBEF;border:1px solid #F1E2B3' : '#F5F7FA') + ';border-radius:10px;padding:10px 12px;font-size:14px"><span style="width:6px;height:6px;border-radius:999px;background:' + (gold ? '#D3AE2A' : '#0F4C81') + ';flex:none"></span>' + e + '</span>'; };
    h += '<div class="gap8"></div><section id="lz-events" class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.idealFor + '</h2><div class="lz-ev-grid">' +
      T.events.slice(0, EV_IDEAL).map(function (e) { return evItem(e, false); }).join('') + '</div>' +
      '<h3 style="margin-top:10px;font-size:17px;font-weight:800">' + T.specialTitle + '</h3><div class="lz-ev-grid">' +
      T.events.slice(EV_IDEAL, EV_OTHER).map(function (e) { return evItem(e, true); }).join('') + '</div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF6DF;border-radius:12px;padding:12px 14px">' + svg(ICON.info, { w: 20, stroke: '#5C4510', style: 'flex:none;margin-top:1px' }) +
      '<span style="font-size:13px;color:#5C4510;line-height:1.5;font-weight:600">' + T.eventsNote + '</span></div></section>';
    // Preguntas frecuentes
    h += '<div class="gap8"></div><section id="lz-faq" class="card"><h2 class="h2">' + T.faq + '</h2><p class="muted" style="font-size:13px;margin-top:4px;margin-bottom:8px">' + T.faqSub + '</p>' +
      T.faqs.map(function (q) { return '<details class="lz-faq"><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('') + '</section>';
    // Políticas
    h += '<div class="gap8"></div><section class="card" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + T.policies + '</h2>' +
      '<div style="border:1px solid #F3C9C9;background:#FDF2F2;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px"><strong style="font-size:15px;color:#8B1D1D">' + T.cancellation + '</strong><span style="font-size:14px;color:#6E1A1A;line-height:1.6">' + T.tbd + '</span></div>' +
      '<div style="border:1px solid #EFDFA6;background:#FFFBEA;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px"><strong style="font-size:15px;color:#6B4F00">' + T.dateChange + '</strong><span style="font-size:14px;color:#5C4510;line-height:1.6">' + T.tbd + '</span></div>' +
      '<div style="border:1px solid #C9DBF2;background:#F0F6FD;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px"><strong style="font-size:15px;color:#0F4C81">' + T.refundTitle + '</strong><span style="font-size:14px;color:#123E66;line-height:1.6">' + T.tbd + '</span></div>' +
      '<h3 style="margin-top:8px;font-size:16px;font-weight:800">' + T.terms + '</h3>' + tplTerms(T) + '</section>';
    if (desk) h += '</div>' + tplDeskSide(c) + '</div>';
    h += '<div class="muted" style="padding:22px 18px;text-align:center;font-size:12px;display:flex;flex-direction:column;gap:8px;align-items:center"><span>' + T.footer + '</span><a href="privacy.html?lang=' + c.L + '" style="color:#0F4C81;font-weight:700">' + T.privacy + '</a></div></main>';
    if (desk) return h;
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

  // Pasos de la reserva: cuáles ya están listos y en cuál va el cliente
  function stepsState(c) {
    var done = [c.hasNights, state.confirmed, state.confirmed, !!state.name.trim() && phoneCheck(state.cc, state.phone).status === 'ok', state.termsOk];
    var cur = 0; while (cur < done.length && done[cur]) cur++;
    return { done: done, cur: cur, ids: ['lz-s-dates', 'lz-s-guests', 'lz-s-beds', 'lz-s-details', 'lz-s-terms'] };
  }
  function tplSteps(c) {
    var T = c.T, st = stepsState(c), n = st.done.length, allDone = st.cur >= n;
    return '<div class="lz-steps-top"><span class="lz-steps-of">' + (allDone ? T.stepsDone : T.stepOf(st.cur + 1, n)) + '</span></div>' +
      '<ol class="lz-steps">' + T.steps.map(function (lb, i) {
        var cls = st.done[i] ? 'done' : (i === st.cur ? 'now' : '');
        return '<li class="' + cls + '"><a href="#' + st.ids[i] + '"><span class="lz-step-dot">' + (st.done[i] ? svg(ICON.check, { w: 13, sw: 3, stroke: '#fff' }) : (i + 1)) + '</span><span class="lz-step-lb">' + lb + '</span></a></li>';
      }).join('') + '</ol>';
  }
  function renderSteps() { var el = document.getElementById('lz-steps'); if (el) el.innerHTML = tplSteps(calc()); }
  function tplBook(c) {
    var T = c.T, h = '';
    var waitingOut = !!(state.checkin && !state.checkout);
    var on = state.confirmed;
    var box = function (active) { return 'border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;border:' + (active ? '2px solid #0F4C81;background:#F2F7FC' : '1.5px solid #0B2E4F') + ';'; };
    var desk = isDesk();
    h += (desk ? tplDeskHeader(c, true) : '<header class="fixed-top" style="height:60px;background:#fff;border-bottom:1px solid #E3E8EE;display:flex;align-items:center;gap:8px;padding:0 10px">' +
      '<button type="button" class="icon-btn" data-act="goHome" aria-label="' + T.back + '" style="border:0">' + svg(c.rtl ? ICON.backR : ICON.backL, { sw: 2 }) + '</button>' +
      '<span style="font-size:17px;font-weight:800">' + T.confirmTitle + '</span></header>') +
      '<div id="lz-steps" class="fixed-top lz-steps-wrap">' + tplSteps(c) + '</div>';
    h += desk ? '<main class="lz-dmain lz-dbook"><div class="lz-dgrid"><div class="lz-dcol">' : '<main style="padding-top:calc(126px + env(safe-area-inset-top));padding-bottom:calc(140px + env(safe-area-inset-bottom))">';
    h += '<div style="background:#fff;padding:14px 18px;display:flex;align-items:center;gap:14px"><span style="width:64px;height:64px;border-radius:14px;background:linear-gradient(160deg,#0B2E4F,#1F6FB2);flex:none;display:flex;align-items:center;justify-content:center"><img src="img/stone.svg" alt="" style="width:30px;height:auto"></span>' +
      '<div style="display:flex;flex-direction:column;gap:2px"><strong style="font-size:17px">' + T.resortName + '</strong><span class="muted" style="font-size:13px">' + T.summarySub + '</span></div></div>';
    // Fechas
    h += '<div class="gap8"></div><section id="lz-s-dates" class="card lz-sec" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.dates + '</h2>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' +
      '<div style="' + box(!state.checkin) + '"><span class="muted" style="font-size:12px;font-weight:700">' + T.checkIn + '</span><strong style="font-size:15px">' + c.fmt(state.checkin) + '</strong><span class="muted" style="font-size:12px">' + T.inShort + '</span></div>' +
      '<div style="' + box(waitingOut) + '"><span class="muted" style="font-size:12px;font-weight:700">' + T.checkOut + '</span><strong style="font-size:15px">' + c.fmt(state.checkout) + '</strong><span class="muted" style="font-size:12px">' + T.outShort + '</span></div></div>' +
      tplCalendar(c, true) +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:14px;font-weight:700">' + (c.hasNights ? T.nightsTxt(c.nights) : T.noDates) + '</span>' +
      '<button type="button" data-act="clearDates" style="height:44px;padding:0 12px;border:0;background:transparent;color:#0F4C81;font-size:14px;font-weight:700;cursor:pointer;text-decoration:underline">' + T.clearDates + '</button></div>' +
      '<p style="font-size:13px;line-height:1.5;' + (waitingOut ? 'color:#0F4C81;font-weight:700' : 'color:#5A6573') + '">' + (waitingOut ? T.hintOut : T.hintIn) + '</p></section>';
    // Personas
    h += '<div class="gap8"></div><section id="lz-s-guests" class="card lz-sec" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.guests + '</h2>' +
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
    h += '<div class="gap8"></div><section id="lz-s-beds" class="card lz-sec" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.beds + '</h2>' +
      (on ? '' : '<div style="display:flex;gap:10px;align-items:center;background:#F5F7FA;border-radius:12px;padding:12px;font-size:13px;color:#3D4A58">' + svg(ICON.lock, { w: 18, style: 'flex:none' }) + T.bedsLocked + '</div>') +
      '<div style="border:1px solid #E3E8EE;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:14px;' + (on ? '' : 'opacity:.45') + '"' + (on ? '' : ' aria-disabled="true"') + '>' +
      bedRow(ICON.king, T.kingBed, T.kingBedSub, 'kingMinus', 'kingPlus', T.kingMinusAria, T.kingPlusAria, kMinus, kPlus, c.kings) +
      '<div style="height:1px;background:#E3E8EE"></div>' +
      bedRow(ICON.twin, T.twinBed, T.twinBedSub, 'kingPlus', 'kingMinus', T.twinMinusAria, T.twinPlusAria, kPlus, kMinus, c.twins) +
      '<div style="display:flex;align-items:center;justify-content:space-between;background:#F5F7FA;border-radius:10px;padding:10px 12px;font-size:13px"><span style="color:#3D4A58">' + T.assigned + '</span><strong>' + (on ? (c.kings + c.twins) : '—') + T.ofWord + c.rooms + '</strong></div>' +
      '</div></section>';
    // Motivo
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.purpose + ' <span class="muted" style="font-size:13px;font-weight:600">' + T.optional + '</span></h2>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + T.events.map(function (e, i) { return '<button type="button" class="chip" data-act="event" data-arg="' + i + '" aria-pressed="' + (state.event === i) + '">' + e + '</button>'; }).join('') + '</div>' +
      (state.event !== null && state.event >= EV_IDEAL && state.event < EV_OTHER ? '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF6DF;border-radius:12px;padding:12px 14px">' + svg(ICON.info, { w: 20, stroke: '#5C4510', style: 'flex:none;margin-top:1px' }) + '<span style="font-size:13px;color:#5C4510;line-height:1.5;font-weight:600">' + T.eventNeedsOk + '</span></div>' : '') + '</section>';
    // Datos
    h += '<div class="gap8"></div><section id="lz-s-details" class="card lz-sec" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.details + '</h2>' +
      '<label for="lz-name" class="label">' + T.fullName + '</label><input id="lz-name" class="field" type="text" autocomplete="name" data-field="name" value="' + esc(state.name) + '" placeholder="' + esc(T.namePh) + '">' +
      '<label for="lz-phone" class="label">' + T.phone + '</label>' + tplPhone(c) +
      '<label for="lz-email" class="label">' + T.email + '</label><input id="lz-email" class="field" dir="ltr" type="email" autocomplete="email" data-field="email" value="' + esc(state.email) + '" placeholder="name@email.com"></section>';
    // Precio
    h += '<div class="gap8"></div><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px"><h2 style="font-size:18px;font-weight:800;margin-bottom:4px">' + T.priceDetails + '</h2>';
    if (c.hasNights) {
      h += '<div style="border:1px solid #E3E8EE;border-radius:14px;overflow:hidden"><div style="display:flex;justify-content:space-between;background:#F5F7FA;padding:8px 12px;font-size:12px;font-weight:700;color:#3D4A58"><span>' + T.night + '</span><span>' + T.price + '</span></div>' +
        c.nightRows.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-top:1px solid #EEF2F6;font-size:14px"><span>' + r.label + '</span><span style="font-weight:700;white-space:nowrap">' + r.amount + '</span></div>'; }).join('') + '</div>' +
        c.priceLines.map(function (p) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;color:' + (p.green ? '#15803D' : '#3D4A58') + '"><span>' + p.label + '</span><span style="color:' + (p.green ? '#15803D' : '#0B2E4F') + ';font-weight:700;white-space:nowrap">' + p.amount + '</span></div>'; }).join('') +
        '<div style="height:1px;background:#E3E8EE;margin:4px 0"></div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><strong style="font-size:16px">' + (RIAL ? T.totalLabel.replace(/\s*\(.*\)/, '') : T.totalLabel) + '</strong><strong style="font-size:22px;white-space:nowrap">' + c.money(c.total) + '</strong></div>' +
        '<div style="background:#F5F7FA;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px"><span class="muted" style="font-size:12px;font-weight:700">' + T.inclTaxes + '</span>' +
        c.taxLines.map(function (p) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#5A6573"><span>' + p.label + '</span><span style="white-space:nowrap">' + p.amount + '</span></div>'; }).join('') + '</div>';
    } else {
      h += '<span class="muted" style="font-size:14px">' + T.pickToSee + '</span>';
    }
    h += tplCoupon(c) + '</section>' + tplDeposit(c, true);
    // Términos
    h += '<div class="gap8"></div><section id="lz-s-terms" class="card lz-sec" style="padding:18px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:18px;font-weight:800">' + T.terms + '</h2>' + tplTerms(T) +
      '<label for="lz-terms" style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;padding:6px 0"><input id="lz-terms" type="checkbox" data-act="termsOk"' + (state.termsOk ? ' checked' : '') + ' style="width:24px;height:24px;margin:0;flex:none;accent-color:#0F4C81">' +
      '<span style="font-size:14px;line-height:1.5">' + T.accept + '</span></label>' +
      '<a href="privacy.html?lang=' + c.L + '" target="_blank" rel="noopener" style="font-size:13px;color:#0F4C81;font-weight:700;text-decoration:underline">' + T.privacyNote + '</a></section>' +
      (desk ? '</div><aside class="lz-side"><div id="lz-bar" class="lz-side-card">' + tplSideBar(c) + '</div></aside></div>' : '') + '</main>';
    if (!desk) h += '<div id="lz-bar" class="fixed-bottom" style="background:#fff;border-top:1px solid #E3E8EE;padding:10px 16px calc(18px + env(safe-area-inset-bottom))">' + tplBar(c) + '</div>';
    if (state.ccOpen) h += tplCcSheet(T);
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
    return (state.submitError ? '<p style="font-size:12px;color:#8B1D1D;text-align:center;margin-bottom:6px;font-weight:700">' + (state.submitError === 'taken' ? T.errTaken : T.errGeneric) + '</p>' : '') +
      (c.missing.length ? '<p style="font-size:12px;color:#8B1D1D;text-align:center;margin-bottom:6px">' + T.missing + c.missing.join(T.sep) + '</p>' : (!API.enabled && CONFIG.whatsapp ? '<p style="font-size:12px;color:#14532D;text-align:center;margin-bottom:6px">' + T.waOpen + '</p>' : '')) +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div style="display:flex;flex-direction:column"><strong style="font-size:20px;white-space:nowrap">' + (c.hasNights ? c.money(c.total) : cur('—', T)) + '</strong>' +
      '<span class="muted" style="font-size:11px">' + (c.hasNights ? T.barSub(c.nights, c.rooms) : T.pickDates) + '</span></div>' +
      '<button type="button" data-act="submit"' + (c.canSubmit ? '' : ' disabled') + ' style="height:52px;min-width:150px;padding:0 22px;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:800;' +
      (ok ? 'background:radial-gradient(circle at 50% 50%,#104862 0%,#003047 100%);color:#fff;cursor:pointer' : 'background:#E3E8EE;color:#4F5B69;cursor:not-allowed') + '">' +
      (state.submitting ? STONE_SVG.replace('<svg ', '<svg class="lz-stone" role="img" aria-label="' + T.sending + '" style="width:30px;height:40px" ') : '<span>' + T.bookNow + '</span>') + '</button></div>';
  }

  // Computador: resumen de la reserva a la derecha, con el total y el botón
  function tplSideBar(c) {
    var T = c.T, ok = c.canSubmit || state.submitting;
    var row = function (a, b) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:8px 0;border-top:1px solid #EEF2F6"><span class="muted">' + a + '</span><strong style="text-align:end">' + b + '</strong></div>'; };
    return '<strong style="font-size:17px">' + T.summaryTitle + '</strong>' +
      '<div style="margin-top:10px">' + row(T.rIn, c.fmt(state.checkin) + (state.checkin ? ' · ' + T.inShort : '')) + row(T.rOut, c.fmt(state.checkout) + (state.checkout ? ' · ' + T.outShort : '')) +
      row(T.rGuests, state.confirmed ? T.guestsTxt(state.guests) : '—') + row(T.rRooms, state.confirmed ? T.roomsTxt(c.rooms, c.kings, c.twins) : '—') + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px solid #E3E8EE;padding-top:12px;margin-top:4px"><strong style="font-size:16px">' + T.rTotal + '</strong><strong style="font-size:26px;white-space:nowrap">' + (c.hasNights ? c.money(c.total) : cur('—', T)) + '</strong></div>' +
      '<span class="muted" style="display:block;font-size:12px;text-align:end;margin-bottom:14px">' + (c.hasNights ? T.barSub(c.nights, c.rooms) + ' · ' + T.taxesIncl : T.pickDates) + '</span>' +
      (state.submitError ? '<p style="font-size:12.5px;color:#8B1D1D;margin-bottom:8px;font-weight:700">' + (state.submitError === 'taken' ? T.errTaken : T.errGeneric) + '</p>' : '') +
      (c.missing.length ? '<p style="font-size:12.5px;color:#8B1D1D;margin-bottom:10px;line-height:1.5">' + T.missing + c.missing.join(T.sep) + '</p>' : '') +
      '<button type="button" data-act="submit"' + (c.canSubmit ? '' : ' disabled') + ' style="width:100%;height:54px;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:17px;font-weight:800;' +
      (ok ? 'background:radial-gradient(circle at 50% 50%,#104862 0%,#003047 100%);color:#fff;cursor:pointer' : 'background:#E3E8EE;color:#4F5B69;cursor:not-allowed') + '">' +
      (state.submitting ? STONE_SVG.replace('<svg ', '<svg class="lz-stone" role="img" aria-label="' + T.sending + '" style="width:30px;height:40px" ') : '<span>' + T.bookNow + '</span>') + '</button>' +
      '<p class="muted" style="font-size:12px;line-height:1.5;margin-top:12px">' + T.depositRem(c.whole(CONFIG.deposit)) + '</p>';
  }
  function tplDone(c) {
    var T = c.T;
    var rows = [[T.rIn, c.fmt(state.checkin)], [T.rOut, c.fmt(state.checkout)], [T.rGuests, T.guestsTxt(state.guests)], [T.rRooms, T.roomsTxt(c.rooms, c.kings, c.twins)],
      [T.rPurpose, state.event === null ? T.notGiven : T.events[state.event]], [T.rTotal, c.hasNights ? c.money(c.total) : '—', true]];
    if (c.discount > 0) rows.splice(rows.length - 1, 0, [T.rDiscount(state.coupon, c.pct), '−' + c.money(c.discount), true]);
    return '<main style="background:#fff;min-height:100vh;padding:48px 22px 28px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
      '<svg class="lz-pop" width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" style="flex:none"><circle cx="48" cy="48" r="44" fill="#E7F5EC" stroke="#1F8A4C" stroke-width="3"></circle><path class="lz-check" d="M30 49l12 12 24-26" fill="none" stroke="#1F8A4C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
      '<h1 class="lz-up" style="margin-top:4px;font-size:26px;font-weight:800;text-align:center">' + T.sentTitle + '</h1>' +
      '<p class="lz-up" style="font-size:15px;color:#3D4A58;line-height:1.6;text-align:center">' + (state.bookingCode ? T.sentText : T.sentTextWa) + '</p>' +
      '<div class="lz-up" style="width:100%;border:1px solid #E3E8EE;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px">' +
      (state.bookingCode ? '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span class="muted">' + T.code + '</span><strong style="color:#0F4C81;letter-spacing:.04em" dir="ltr">' + state.bookingCode + '</strong></div>' : '') +
      rows.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span class="muted">' + r[0] + '</span><strong style="text-align:end">' + (r[2] ? r[1] : esc(r[1])) + '</strong></div>'; }).join('') + '</div>' +
      '<div class="lz-up" style="width:100%;background:#FFF6DF;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;font-size:15px;color:#5C4510;line-height:1.4"><strong style="font-size:16px">' + T.remember + '</strong>' +
      '<span style="display:flex;align-items:center;gap:10px">' + svg(ICON.clockIn, { w: 20, stroke: '#5C4510' }) + '<strong>' + T.remIn + '</strong></span>' +
      '<span style="display:flex;align-items:center;gap:10px">' + svg(ICON.clockOut, { w: 20, stroke: '#5C4510' }) + '<strong>' + T.remOut + '</strong></span>' +
      '<div style="margin-top:4px;background:#fff;border:1.5px solid #D3AE2A;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">' + svg(ICON.info, { w: 22, stroke: '#5C4510', style: 'flex:none' }) + '<strong style="font-size:17px;color:#0B2E4F;line-height:1.35">' + T.depositRem(c.whole(CONFIG.deposit)) + '</strong></div></div>' +
      (state.bookingCode && CONFIG.whatsapp ? '<a class="lz-up" href="https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(bookingMessage(c)) + '" target="_blank" rel="noopener" style="width:100%;height:52px;border-radius:14px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:800;text-decoration:none">' + waIcon(20) + T.waSend + '</a>' : '') +
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
    if (state.screen === 'home') initAreasLoop();
  }
  function renderBar() {
    var bar = document.getElementById('lz-bar');
    if (bar) bar.innerHTML = isDesk() ? tplSideBar(calc()) : tplBar(calc());
  }

  // ===================== ACCIONES =====================
  var submitTimer = null;
  var actions = {
    lang: function (code) { var first = !introShown; if (first) holdHero = true; set({ lang: code, screen: 'home' }); if (first) playIntro(); },
    openLang: function () { set({ screen: 'lang' }); },
    goBook: function () { set({ screen: 'book' }); },
    goHome: function () { set({ screen: 'home' }); },
    ccOpen: function () { lockPage(true); set({ ccOpen: true }); setTimeout(function () { var q = document.getElementById('lz-ccq'); if (q) q.focus({ preventScroll: true }); }, 60); },
    ccClose: function () { set({ ccOpen: false }); lockPage(false); },
    ccPick: function (iso) { set({ cc: iso, ccOpen: false }); lockPage(false); var i = document.getElementById('lz-phone'); if (i) { i.focus({ preventScroll: true }); setTimeout(function () { i.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 150); } },
    heroAt: function (i) { state.gIdx = Number(i) || 0; actions.heroOpen(); },
    heroOpen: function () {
      var n = HERO.length, gi = ((state.gIdx % n) + n) % n, L = state.lang;
      galLast = Date.now() + 600000;
      openViewer(HERO.map(function (h) { return h.video ? { video: h.video, poster: h.poster, cap: h.t[L] } : { img: h.img, cap: h.t[L] }; }), gi, HERO[gi].t[L]);
    },
    zoneOpen: function (i) {
      var z = ZONES[+i], L = state.lang, T = DICT[L];
      z.idx = +i;
      var title = z.t[L] + (z.n ? ' · ' + (state.night ? T.atNightCap : T.atDay) : '');
      openViewer(z.video ? [{ video: z.video, poster: z.poster }] : zonePhotos(z, state.night).map(function (p) { return { img: p }; }), 0, title, z);
    },
    dayNight: function (v) { var on = v === '1'; if (on === state.night) return; state.night = on; applyDayNight(); },
    couponApply: function () {
      var code = String(state.couponTry || '').replace(/\s+/g, '').toUpperCase();
      if (!code) return set({ coupon: null, couponErr: false });
      fetch('/api/coupon?code=' + encodeURIComponent(code)).then(function (r) { return r.json(); })
        .then(function (d) { if (d.ok) set({ coupon: d.code, couponPct: d.pct, couponErr: false, couponTry: '' }); else set({ coupon: null, couponPct: 0, couponErr: true }); })
        .catch(function () { set({ coupon: null, couponPct: 0, couponErr: true }); });
    },
    couponRemove: function () { set({ coupon: null, couponPct: 0, couponErr: false, couponTry: '' }); },
    areasStep: function (d) {
      var row = document.querySelector('.lz-areas'); if (!row) return;
      var step = row.children[1].offsetLeft - row.children[0].offsetLeft;
      row.scrollBy({ left: step * Number(d), behavior: 'smooth' });
    },
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
      var c0 = calc();
      if (!c0.canSubmit) return;
      // Sin base de datos todavía: la solicitud se envía por WhatsApp
      if (!API.enabled && CONFIG.whatsapp) window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(bookingMessage(c0)), '_blank');
      set({ submitting: true, submitError: null, bookingCode: null });
      var sv = document.querySelector('#lz-bar .lz-stone');
      var stop = sv ? stoneLoop(sv, true) : function () {};
      var started = Date.now();
      function finish(patch) { setTimeout(function () { stop(); set(patch); }, Math.max(0, 1800 - (Date.now() - started))); }
      if (!API.enabled) return finish({ submitting: false, screen: 'done' });
      var p = PHONE_BY[state.cc] || PHONE_BY.OM;
      fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        checkin: state.checkin, checkout: state.checkout, guests: state.guests, kings: c0.kings, event: state.event,
        name: state.name.trim(), phone: '+' + p[1] + phoneCheck(state.cc, state.phone).digits, email: state.email.trim(),
        lang: state.lang, coupon: state.coupon, termsAccepted: state.termsOk })
      }).then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
        .then(function (res) {
          if (res.d.ok) { loadConfig(); finish({ submitting: false, screen: 'done', bookingCode: res.d.code }); }
          else { if (res.status === 409) loadConfig(); finish({ submitting: false, submitError: res.status === 409 ? 'taken' : 'generic' }); }
        })
        .catch(function () { finish({ submitting: false, submitError: 'generic' }); });
    },
    restart: function () {
      set({ screen: 'home', checkin: null, checkout: null, guests: CONFIG.baseGuests, confirmed: false, kings: CONFIG.maxKing, event: null, termsOk: false, termsOpen: false, coupon: null, couponPct: 0, bookingCode: null, submitError: null });
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
    if (f === 'ccq') { var l = document.getElementById('lz-cc-list'); if (l) l.innerHTML = ccRows(DICT[state.lang], e.target.value); return; }
    if (f === 'phone') {
      var clean = e.target.value.replace(/[^\d\s]/g, '');
      if (clean !== e.target.value) e.target.value = clean;
      state.phone = clean;
      var m = document.getElementById('lz-phone-msg'); if (m) m.innerHTML = phoneMsg(DICT[state.lang]);
      renderBar(); renderSteps(); return;
    }
    if (f) { state[f] = e.target.value; renderBar(); renderSteps(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.ccOpen) actions.ccClose(); if (e.key === 'Enter' && e.target.id === 'lz-coupon') { e.preventDefault(); actions.couponApply(); } });
  // Mientras el cliente escribe (teclado abierto) la barra de Reservar se oculta para no tapar los datos
  var kbTimer = null;
  function isTyping(el) { return el && el.matches && el.matches('input:not([type=checkbox]):not([type=radio]), textarea'); }
  document.addEventListener('focusin', function (e) { if (isTyping(e.target)) { clearTimeout(kbTimer); document.body.classList.add('lz-typing'); } });
  document.addEventListener('focusout', function (e) {
    if (!isTyping(e.target)) return;
    clearTimeout(kbTimer);
    kbTimer = setTimeout(function () { if (!isTyping(document.activeElement)) document.body.classList.remove('lz-typing'); }, 120);
  });

  // ===================== GALERÍA: cambia sola y se desliza con el dedo =====================
  var galLast = 0, holdHero = false;
  function galGo(step, byUser) {
    state.gIdx += step;
    if (byUser) galLast = Date.now();
    var el = document.getElementById('lz-top');
    if (el) el.outerHTML = tplGallery(calc());
  }
  setInterval(function () {
    var n = HERO.length, cur = HERO[((state.gIdx % n) + n) % n];
    if (state.screen === 'home' && !cur.loop && Date.now() - galLast > 8000) galGo(1, false);
  }, 4500);
  var touchX = null;
  app.addEventListener('touchstart', function (e) { touchX = e.target.closest && e.target.closest('#lz-top') ? e.touches[0].clientX : null; }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) galGo((dx < 0) !== (state.lang === 'ar') ? 1 : -1, true);
  }, { passive: true });

  // ===================== ANIMACIÓN DE ENTRADA =====================
  // Se muestra después de escoger el idioma: la piedra se arma una sola vez sobre el fondo azul
  // y la pantalla se desvanece directo a la página.
  var splash = document.getElementById('splash');
  var splashSvg = splash.querySelector('svg');
  var introShown = false, introTimers = [];
  var splashWord = splash.querySelector('.lz-splash-word');
  function endIntro() {
    introTimers.forEach(clearTimeout);
    if (splash.classList.contains('fly')) return;
    // El video de arriba arranca desde el segundo 0 justo cuando el logo sube
    holdHero = false;
    var hv = document.querySelector('#lz-top video');
    if (hv) { try { hv.currentTime = 0; } catch (e) {} var pp = hv.play(); if (pp && pp.catch) pp.catch(function () {}); }
    // El logo grande viaja y se encoge hasta quedar exactamente sobre el logo del encabezado
    splash.classList.add('fly');
    var target = document.querySelector('header img[alt="Lazurde"]');
    if (target && splashWord) {
      // Mientras el logo vuela, el del encabezado se esconde para que no se vean dos
      target.style.opacity = '0';
      setTimeout(function () { var t = document.querySelector('header img[alt="Lazurde"]'); if (t) t.style.opacity = ''; }, 860);
      void splashWord.offsetWidth;
      var from = splashWord.getBoundingClientRect(), to = target.getBoundingClientRect();
      if (from.width && to.width) {
        var dx = (to.left + to.width / 2) - (from.left + from.width / 2), dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        splashWord.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (to.width / from.width).toFixed(4) + ')';
      }
    }
    setTimeout(function () { splash.classList.add('hide'); splash.style.display = 'none'; }, 900);
  }
  function playIntro() {
    introShown = true;
    splash.classList.remove('hide', 'light', 'fly');
    splash.style.display = 'flex';
    if (splashWord) { splashWord.style.transform = ''; splashWord.classList.remove('in'); void splashWord.offsetWidth; splashWord.classList.add('in'); }
    introTimers.push(setTimeout(endIntro, 1900));
  }
  splash.addEventListener('click', endIntro);
  splash.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endIntro(); } });

  // ===================== INTRO AL ABRIR LA PÁGINA =====================
  // La piedra se arma sobre el azul, aparece el brillo dorado y el nombre LAZURDE;
  // luego se desvanece y queda la pantalla de idiomas.
  var opening = document.createElement('div');
  opening.className = 'lz-opening';
  opening.setAttribute('role', 'button'); opening.setAttribute('tabindex', '0'); opening.setAttribute('aria-label', 'Lazurde Resort');
  opening.innerHTML = '<span class="lz-op-glow"></span>' + STONE_SVG.replace(/lzg2/g, 'lzg3') + '<img class="lz-op-word" src="img/wordmark.svg" alt="Lazurde">';
  document.body.appendChild(opening);
  var opTimer = null;
  function endOpening() {
    clearTimeout(opTimer);
    if (!opening) return;
    var el = opening; opening = null;
    el.classList.add('hide');
    setTimeout(function () { el.remove(); }, 800);
  }
  stoneLoop(opening.querySelector('svg'), false, 1);
  opening.addEventListener('click', endOpening);
  opening.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endOpening(); } });
  opTimer = setTimeout(endOpening, 3900);
  set({ screen: 'lang' });
  if (DESK.addEventListener) DESK.addEventListener('change', function () { if (state.screen !== 'lang') render(); });
  loadConfig();
  // Keep availability fresh: re-check every 30 s while the page is visible, and when the guest returns to it
  setInterval(function () { if (!document.hidden && !state.submitting && (state.screen === 'home' || state.screen === 'book')) loadConfig(true); }, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) loadConfig(true); });
})();
