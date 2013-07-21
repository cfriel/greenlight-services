Package.describe({
  summary: "Greenlight services site template"
});

Package.on_use(function (api, where) {
    api.add_files('services.js', 'server');
    console.log("using greenlight services");
});

Package.on_test(function (api) {
    api.add_files('services_tests.js', 'client');
});
