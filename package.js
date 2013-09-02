Package.describe({
  summary: "Greenlight services site template"
});

Npm.depends({mongodb: "1.3.4", prozess: "0.6.1", elasticsearch: "0.3.11" });

Package.on_use(function (api, where) {

    api.use('router', ['client', 'server']);
    api.use('deps', ['client', 'server']);
    api.use('session', ['client', 'server']);
    api.use('greenlight', ['client','server']);

    api.add_files('server/services.js', 'server');
});

Package.on_test(function (api) {
    api.add_files('services_tests.js', 'client');
});
