$(function () {
    var path = window.location.href.split('.html')[1];
    var BUILT = 'BUILT',
        BUILD_IN_PROGRESS = 'BUILD_IN_PROGRESS',
        CREATED = 'CREATED';
    var $packageName = $('#packageName'),
        $name = $('#name'),
        $version = $('#version'),
        $lastBuilt = $('#lastBuilt-time'),
        $filters = $('#filters'),
        $packageSize = $('#packageSize'),
        $buildButton = $('#buildButton'),
        $referencedResources = $('#referencedResources').find('div'),
        $referencedResourcesList = $('#referencedResourcesList'),
        $testBuildButton = $('#testBuildButton'),
        $downloadBtn = $('#downloadBtn'),
        $buildLog = $('#buildLog'),
        $buildLogWrapper = $('#build-log-wrapper');

    if (path && $packageName.length != 0) {
        disableAllActions();
        getPackageInfo(path, function (data) {
            if (data.packageStatus === BUILT) {
                packageBuilt();
            } else if (data.packageStatus === BUILD_IN_PROGRESS) {
                updateLog(0);
            } else if (data.packageStatus === CREATED) {
                packageCreated();
            }

            $packageName.html('Package name: ' + data.packageName);
            $name.text(data.packageNodeName);
            $version.text('Package version: ' + data.version);
            $lastBuilt.val(getLastBuiltDate(data.packageBuilt));
            if (data.dataSize) {
                $packageSize.text('Package size: ' + bytesToSize(data.dataSize));
            }

            function initFilters() {
                if (data.paths) {
                    var filters = '';
                    $.each(data.paths, function (index, value) {
                        filters = filters + '<div>' + value + '</div>'
                    });
                    $filters.append(filters);
                }
            }

            function initReferencedResources() {
                if (data.referencedResources) {
                    $.each(data.referencedResources, function (key, referencedValue) {
                        var checkbox = new Coral.Checkbox().set({
                            label: {
                                innerHTML: key
                            },
                            value: key,
                            name: 'referencedResources'
                        });
                        $referencedResources.append(checkbox);

                        var listItem = '<li><h4>' + key + '</h4>';
                        $.each(referencedValue, function (index, value) {
                            listItem += '<div>' + value + '</div>'
                        });
                        listItem += '</li>';
                        $referencedResourcesList.append(listItem)
                    });
                }

            }

            initFilters();
            initReferencedResources();
        });
    }

    $testBuildButton.click(function () {
        buildPackage(true);
    });


    $buildButton.click(function () {
        disableAllActions();
        buildPackage(false);
    });

    $downloadBtn.click(function () {
        downloadPackage();
    });

    function downloadPackage() {
        window.location.href = path;
    }

    function buildPackage(testBuild) {
        var referencedResources = [];
        $('input[name="referencedResources"]:checked').each(function () {
            referencedResources.push(this.value);
        });
        $.ajax({
            type: 'POST',
            url: '/services/backpack/buildPackage',
            data: {
                path: path,
                referencedResources: referencedResources,
                testBuild: testBuild
            }, success: function (data) {
                $buildLog.empty();
                if (testBuild) {
                    if (data.buildLog) {
                        $.each(data.buildLog, function (index, value) {
                            $buildLog.append('<div>' + value + '</div>');
                        });
                        $buildLog.append('<h4>Approximate referenced resources size: ' + bytesToSize(data.dataSize) + '</h4>');
                        scrollLog();
                    }
                } else {
                    updateLog(0);
                }
            },
            dataType: 'json'
        });
    }

    function disableAllActions() {
        $downloadBtn.prop('disabled', true);
        $testBuildButton.prop('disabled', true);
        $buildButton.prop('disabled', true);
    }
    function packageBuilt() {
        $buildButton.text('Rebuild');
        $downloadBtn.prop('disabled', false);
        $testBuildButton.prop('disabled', false);
        $buildButton.prop('disabled', false);
    }

    function packageCreated() {
        $testBuildButton.prop('disabled', false);
        $buildButton.prop('disabled', false);
    }

    function getLastBuiltDate(packageBuiltDate) {
        if (packageBuiltDate) {
            return new Date(packageBuiltDate.year,
                packageBuiltDate.month,
                packageBuiltDate.dayOfMonth,
                packageBuiltDate.hourOfDay,
                packageBuiltDate.minute,
                packageBuiltDate.second).toISOString();
        }
        return 'never';
    }

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }

    function updateLog(logIndex) {
        $.ajax({
            url: '/services/backpack/buildPackage',
            data: {path: path, latestLogIndex: logIndex},
            success: function (data) {
                if (data.buildLog && data.buildLog.length) {
                    $.each(data.buildLog, function (index, value) {
                        $buildLog.append('<div>' + value + '</div>');
                    });
                    console.log(logIndex);
                    logIndex = logIndex + data.buildLog.length;

                    scrollLog();
                }
                if (data.packageStatus === BUILD_IN_PROGRESS) {
                    setTimeout(function () {
                        updateLog(logIndex);
                    }, 1000);

                } else if (data.packageStatus === BUILT) {
                    packageBuilt();
                }
            }
        })
    }

    function getPackageInfo(packagePath, updateFunction) {
        $.ajax({
            url: '/services/backpack/packageInfo',
            data: {path: packagePath},
            success: updateFunction,
        });
    }

    function scrollLog() {
        $buildLogWrapper.stop().animate({
            scrollTop: $buildLogWrapper[0].scrollHeight
        }, 800);
        $buildLogWrapper[0].scrollIntoView();
    }
});