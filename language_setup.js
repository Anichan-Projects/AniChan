const language = require('i18n');

language.configure({
    locales: ['vi', 'en'],
    directory: __dirname + '/language',
    defaultLocale: 'en',
    objectNotation: true,
});

module.exports = language;