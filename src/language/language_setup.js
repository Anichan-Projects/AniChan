const language = require('i18n');

language.configure({
    locales: ['vi', 'en'],
    directory: __dirname + '/language',
    defaultLocale: 'vi',
    objectNotation: true,
});

module.exports = language;