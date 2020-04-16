// tslint:disable: max-line-length
export const commandsText = `
/schedule - розклад вистав
/theatres - інформація про театри
/actors - інформація про акторів
/subscribe - підписатися на оновлення
/unsubscribe - відписатися від оновлень
/help - допомога
`;

export const helpMsg = `
Ви можете скористатися наступними командами:
${commandsText}
`;

export const startMsg = `
Вітаємо! Цей бот містить інформацію про театри міста Києва та вистави, що в них відбуваються. Пропонуємо вам скористатися наступними командами:
${commandsText}
` + `\n\n Усі побажання та зауваження надсилайте на Telegram: @ansttss`;

export const sorryMsg = `
Вибачте, такої команди не існує. Пропонуємо вам скористатися наступними командами:
${commandsText}
`;

export const serviceErrMsg = `
Вибачте, але сервіс тимчасово недоступний
`;

export const cmdParamErr = `
Невірний параметр команди
`;

export const waitMsg = `
Хвилинку...
`;

export const loginedMsg = `
Ви успішно авторизовані у якості адміну!
`;

export const logoutMsg = `
Ви успішно вийшли з системи
`;

export const logoutErrMsg = `
Помилка виходу з системи
`;

export const subscribeMsg = `
Ви підписались на оновлення Тепер ви будете отримувати інформацію про нові фільми в кінотеатрі
`;

export const unsubscribeMsg = `
Ви відписались від оновлень. Підписку завжди можна відновити виконавши команду /subscribe
`;
// tslint:enable: max-line-length
