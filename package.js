Package.describe({
  summary: "Greenlight services site template"
});

Npm.depends({mongodb: "1.3.4"});

Package.on_use(function (api, where) {
    api.use('npm', 'server');
    api.use('router', ['client', 'server']);
    api.add_files('services.js', 'server');
});

Package.on_test(function (api) {
    api.add_files('services_tests.js', 'client');
});
