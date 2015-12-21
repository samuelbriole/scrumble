'use strict';
var app;

app = angular.module('NotSoShitty', ['ng', 'ngResource', 'ngAnimate', 'ngSanitize', 'ngMaterial', 'md.data.table', 'ui.router', 'app.templates', 'Parse', 'LocalStorageModule', 'satellizer', 'permission', 'trello-api-client', 'angular-google-gapi', 'NotSoShitty.bdc', 'NotSoShitty.common', 'NotSoShitty.daily-report', 'NotSoShitty.gmail-client', 'NotSoShitty.feedback', 'NotSoShitty.login', 'NotSoShitty.settings', 'NotSoShitty.storage']);

app.config(function($locationProvider, $urlRouterProvider, ParseProvider) {
  $locationProvider.hashPrefix('!');
  $urlRouterProvider.otherwise('/login/trello');
  return ParseProvider.initialize("UTkdR7MH2Wok5lyPEm1VHoxyFKWVcdOKAu6A4BWG", "DGp8edP1LHPJ15GpDE3cp94bBaDq2hiMSqLEzfZB");
});

app.config(function(localStorageServiceProvider) {
  return localStorageServiceProvider.setPrefix('');
});

app.config(function(TrelloClientProvider) {
  return TrelloClientProvider.init({
    key: '2dcb2ba290c521d2b5c2fd69cc06830e',
    appName: 'Not So Shitty',
    tokenExpiration: 'never',
    scope: ['read', 'account']
  });
});

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('grey');
});

app.config(function($mdIconProvider) {
  return $mdIconProvider.defaultIconSet('icons/mdi.light.svg');
});

app.run(function($rootScope, $state) {
  return $rootScope.$state = $state;
});

app.config(function($stateProvider) {
  return $stateProvider.state('tab', {
    abstract: true,
    controller: 'BaseCtrl',
    templateUrl: 'common/states/base.html'
  });
});

angular.module('NotSoShitty.common', ['trello-api-client']);

angular.module('NotSoShitty.feedback', []);

angular.module('NotSoShitty.gmail-client', []);

angular.module('NotSoShitty.daily-report', []);

angular.module('NotSoShitty.login', []);

angular.module('NotSoShitty.settings', ['NotSoShitty.common']);

angular.module('NotSoShitty.bdc', ['ui.router', 'Parse', 'ngMaterial']);

angular.module('NotSoShitty.storage', []);

angular.module('NotSoShitty.common').service('dynamicFields', function($q, trelloUtils) {
  var dict, getCurrentDayIndex, project, replaceToday, replaceYesterday, sprint;
  sprint = null;
  project = null;
  getCurrentDayIndex = function(bdcData) {
    var day, i, _i, _len;
    for (i = _i = 0, _len = bdcData.length; _i < _len; i = ++_i) {
      day = bdcData[i];
      if (day.done == null) {
        return Math.max(i - 1, 0);
      }
    }
    return 0;
  };
  dict = {
    '{sprintNumber}': {
      value: function() {
        return sprint != null ? sprint.number : void 0;
      },
      description: 'Current sprint number',
      icon: 'cow'
    },
    '{sprintGoal}': {
      value: function() {
        return sprint != null ? sprint.goal : void 0;
      },
      description: 'The sprint goal (never forget it)',
      icon: 'target'
    },
    '{speed}': {
      value: function() {
        var _ref, _ref1, _ref2;
        if (_.isNumber(sprint != null ? (_ref = sprint.resources) != null ? _ref.speed : void 0 : void 0)) {
          return sprint != null ? (_ref1 = sprint.resources) != null ? _ref1.speed.toFixed(1) : void 0 : void 0;
        } else {
          return sprint != null ? (_ref2 = sprint.resources) != null ? _ref2.speed : void 0 : void 0;
        }
      },
      description: 'Estimated number of points per day per person',
      icon: 'run'
    },
    '{toValidate}': {
      value: function() {
        var _ref;
        if ((project != null ? (_ref = project.columnMapping) != null ? _ref.toValidate : void 0 : void 0) != null) {
          return trelloUtils.getColumnPoints(project.columnMapping.toValidate);
        }
      },
      description: 'The number of points in the Trello to validate column',
      icon: 'phone'
    },
    '{blocked}': {
      value: function() {
        var _ref;
        if ((project != null ? (_ref = project.columnMapping) != null ? _ref.blocked : void 0 : void 0) != null) {
          return trelloUtils.getColumnPoints(project.columnMapping.blocked);
        }
      },
      description: 'The number of points in the Trello blocked column',
      icon: 'radioactive'
    },
    '{done}': {
      value: function() {
        var index;
        if ((sprint != null ? sprint.bdcData : void 0) != null) {
          index = getCurrentDayIndex(sprint.bdcData);
          return sprint.bdcData[index].done;
        }
      },
      description: 'The number of points in the Trello done column',
      icon: 'check'
    },
    '{gap}': {
      value: function() {
        var diff, index;
        if ((sprint != null ? sprint.bdcData : void 0) != null) {
          index = getCurrentDayIndex(sprint.bdcData);
          diff = sprint.bdcData[index].done - sprint.bdcData[index].standard;
          return Math.abs(diff).toFixed(1);
        }
      },
      description: 'The difference between the standard points and the done points',
      icon: 'tshirt-crew'
    },
    '{total}': {
      value: function() {
        var _ref;
        if (_.isNumber(sprint != null ? (_ref = sprint.resources) != null ? _ref.totalPoints : void 0 : void 0)) {
          return sprint.resources.totalPoints;
        }
      },
      description: 'The number of points to finish the sprint',
      icon: 'cart'
    }
  };
  replaceToday = function(text) {
    return text.replace(/\{today#(.+?)\}/g, function(match, dateFormat) {
      return moment().format(dateFormat);
    });
  };
  replaceYesterday = function(text) {
    return text.replace(/\{yesterday#(.+?)\}/g, function(match, dateFormat) {
      return moment().subtract(1, 'days').format(dateFormat);
    });
  };
  return {
    sprint: function(_sprint_) {
      return sprint = _sprint_;
    },
    project: function(_project_) {
      return project = _project_;
    },
    getAvailableFields: function() {
      var result;
      result = _.map(dict, function(value, key) {
        return {
          key: key,
          description: value.description,
          icon: value.icon
        };
      });
      result.push({
        key: '{today#format}',
        description: 'Today\'s date where format is a <a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank">moment format</a>',
        icon: 'clock'
      });
      result.push({
        key: '{yesterday#format}',
        description: 'Yesterday\'s date where format is a <a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank">moment format</a>. examples: EEEE for weekday, YYYY-MM-DD',
        icon: 'calendar-today'
      });
      return result;
    },
    render: function(text) {
      var deferred, elt, key, promises, result;
      result = text || '';
      deferred = $q.defer();
      promises = {};
      for (key in dict) {
        elt = dict[key];
        promises[key] = elt.value();
      }
      $q.all(promises).then(function(builtDict) {
        for (key in builtDict) {
          elt = builtDict[key];
          result = result.split(key).join(elt);
        }
        result = replaceToday(result);
        result = replaceYesterday(result);
        return deferred.resolve(result);
      })["catch"](deferred.reject);
      return deferred.promise;
    }
  };
});

angular.module('NotSoShitty.common').service('trelloUtils', function(TrelloClient) {
  var getCardPoints;
  getCardPoints = function(card) {
    var match, matchVal, value, _i, _len;
    if (!card.name) {
      return;
    }
    match = card.name.match(/\(([-+]?[0-9]*\.?[0-9]+)\)/);
    value = 0;
    if (match) {
      for (_i = 0, _len = match.length; _i < _len; _i++) {
        matchVal = match[_i];
        if (!isNaN(parseFloat(matchVal, 10))) {
          value = parseFloat(matchVal, 10);
        }
      }
    }
    return value;
  };
  return {
    getColumnPoints: function(columnId) {
      return TrelloClient.get('/lists/' + columnId + '/cards?fields=name').then(function(response) {
        var cards;
        cards = response.data;
        return _.sum(cards, getCardPoints);
      })["catch"](function(err) {
        console.warn(err);
        return 0;
      });
    }
  };
});

angular.module('NotSoShitty.common').controller('BaseCtrl', function($scope, $mdSidenav, $state, Avatar, localStorageService) {
  $scope.toggleSidenav = function(menuId) {
    return $mdSidenav(menuId).toggle();
  };
  $scope.close = function(menuId) {
    return $mdSidenav(menuId).close();
  };
  $scope.member = Avatar.getMember(localStorageService.get('trello_email'));
  $scope.project = function() {
    $state.go('tab.project');
    return $scope.close('left');
  };
  $scope.sprint = function() {
    $state.go('tab.current-sprint');
    return $scope.close('left');
  };
  return $scope.dailyReport = function() {
    $state.go('tab.daily-report');
    return $scope.close('left');
  };
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('NotSoShitty.feedback').factory('Feedback', function(Parse) {
  var Feedback;
  return Feedback = (function(_super) {
    __extends(Feedback, _super);

    function Feedback() {
      return Feedback.__super__.constructor.apply(this, arguments);
    }

    Feedback.configure("Feedback", "reporter", "message");

    return Feedback;

  })(Parse.Model);
});

angular.module('NotSoShitty.gmail-client').run(function(GApi, GAuth) {
  GApi.load('gmail', 'v1');
  GAuth.setClient('605908567890-3bg3dmamghq5gd7i9sqsdhvoflef0qku.apps.googleusercontent.com');
  return GAuth.setScope('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.send');
});

angular.module('NotSoShitty.feedback').controller('feedbackCallToActionCtrl', function($scope, $mdDialog, $mdMedia) {
  var DialogController;
  $scope.customFullscreen = $mdMedia('sm');
  $scope.openFeedbackModal = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'feedback/directives/dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: $mdMedia('sm') && $scope.customFullscreen
    }).then((function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }), function() {
      $scope.status = 'You cancelled the dialog.';
    });
    $scope.$watch((function() {
      return $mdMedia('sm');
    }), function(sm) {
      $scope.customFullscreen = sm === true;
    });
  };
  return DialogController = function($scope, $mdDialog, Feedback, localStorageService) {
    $scope.message = null;
    $scope.hide = function() {
      return $mdDialog.hide();
    };
    $scope.cancel = function() {
      return $mdDialog.cancel();
    };
    return $scope.send = function() {
      var feedback;
      console.log('yolo');
      if ($scope.message != null) {
        feedback = new Feedback();
        feedback.reporter = localStorageService.get('trello_email');
        feedback.message = $scope.message;
        return feedback.save().then(function() {
          return $mdDialog.hide();
        });
      }
    };
  };
});

angular.module('NotSoShitty.feedback').directive('feedback', function() {
  return {
    restrict: 'E',
    templateUrl: 'feedback/directives/call-to-action.html',
    scope: {},
    controller: 'feedbackCallToActionCtrl'
  };
});

angular.module('NotSoShitty.gmail-client').service('mailer', function($state, $rootScope, GAuth) {
  return {
    send: function(message, callback) {
      return GAuth.checkAuth().then(function() {
        var base64EncodedEmail, originalMail, request, user;
        if (message.to == null) {
          return callback({
            message: "No 'to' field",
            code: 400
          });
        }
        if (message.subject == null) {
          return callback({
            message: "No 'subject' field",
            code: 400
          });
        }
        if (message.body == null) {
          return callback({
            message: "No 'body' field",
            code: 400
          });
        }
        user = $rootScope.gapi.user;
        originalMail = {
          to: message.to,
          subject: message.subject,
          fromName: user.name,
          from: user.email,
          body: message.body,
          cids: message.cids,
          attaches: []
        };
        base64EncodedEmail = btoa(Mime.toMimeTxt(originalMail));
        base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');
        request = gapi.client.gmail.users.messages.send({
          userId: 'me',
          resource: {
            raw: base64EncodedEmail
          }
        });
        return request.execute(callback);
      }, function() {
        return $state.go('tab.google-login');
      });
    }
  };
});

angular.module('NotSoShitty.daily-report').config(function($stateProvider) {
  return $stateProvider.state('tab.daily-report', {
    url: '/daily-report',
    templateUrl: 'daily-report/states/template/view.html',
    controller: 'DailyReportCtrl',
    resolve: {
      dailyReport: function(NotSoShittyUser, DailyReport, Project) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return DailyReport.getByProject(user.project).then(function(report) {
            if (report != null) {
              return report;
            }
            report = new DailyReport({
              project: new Project(user.project),
              message: {
                subject: '[MyProject] Sprint #{sprintNumber} - Daily Mail {today#YYYY-MM-DD}',
                body: 'Hello Batman,\n\n' + 'here is the daily mail:\n\n' + '- Done: {done} / {total} points\n' + '- To validate: {toValidate} points\n' + '- Blocked: {blocked} points\n' + '- {behind/ahead}: {gap} points\n\n' + '{bdc}\n\n' + 'Yesterday\'s goals:\n' + '- Eat carrots\n\n' + 'Today\'s goals\n' + '- Eat more carrots\n\n' + 'Regards!',
                behindLabel: 'Behind',
                aheadLabel: 'Ahead'
              }
            });
            return report.save();
          });
        });
      },
      sprint: function(NotSoShittyUser, Sprint) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return Sprint.getActiveSprint(user.project);
        })["catch"](function(err) {
          console.log(err);
          return null;
        });
      }
    }
  });
});

angular.module('NotSoShitty.daily-report').service('reportBuilder', function($q, NotSoShittyUser, Sprint, Project, trelloUtils, dynamicFields) {
  var converter, project, promise, renderBDC, renderBehindAhead, renderTo, sprint;
  converter = new showdown.Converter();
  promise = void 0;
  project = void 0;
  sprint = void 0;
  renderBehindAhead = function(message) {
    var getCurrentDayIndex;
    getCurrentDayIndex = function(bdcData) {
      var day, i, _i, _len;
      for (i = _i = 0, _len = bdcData.length; _i < _len; i = ++_i) {
        day = bdcData[i];
        if (day.done == null) {
          return Math.max(i - 1, 0);
        }
      }
    };
    return promise.then(function() {
      var diff, index, label;
      index = getCurrentDayIndex(sprint.bdcData);
      diff = sprint.bdcData[index].done - sprint.bdcData[index].standard;
      label = diff > 0 ? message.aheadLabel : message.behindLabel;
      message.body = message.body.replace('{behind/ahead}', label);
      message.subject = message.subject.replace('{behind/ahead}', label);
      return message;
    });
  };
  renderBDC = function(message, bdcBase64, useCid) {
    var src;
    src = useCid ? 'cid:bdc' : bdcBase64;
    return promise.then(function() {
      message.body = message.body.replace('{bdc}', "<img src='" + src + "' />");
      if (useCid) {
        message.cids = [
          {
            type: 'image/png',
            name: 'BDC',
            base64: bdcBase64.split(',')[1],
            id: 'bdc'
          }
        ];
      }
      return message;
    });
  };
  renderTo = function(message) {
    return promise.then(function() {
      var devsEmails, member, memberEmails;
      devsEmails = (function() {
        var _i, _len, _ref, _results;
        _ref = project.team.dev;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _results.push(member.email);
        }
        return _results;
      })();
      memberEmails = (function() {
        var _i, _len, _ref, _results;
        _ref = project.team.rest;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _results.push(member.email);
        }
        return _results;
      })();
      message.to = _.filter(_.union(devsEmails, memberEmails));
      return message;
    });
  };
  return {
    init: function() {
      return promise = NotSoShittyUser.getCurrentUser().then(function(user) {
        project = user.project;
        return project;
      }).then(function(project) {
        return Sprint.getActiveSprint(new Project(project)).then(function(_sprint_) {
          return sprint = _sprint_;
        });
      });
    },
    render: function(message, useCid) {
      message = angular.copy(message);
      message.body = converter.makeHtml(message.body);
      dynamicFields.sprint(sprint);
      dynamicFields.project(project);
      return dynamicFields.render(message.subject).then(function(subject) {
        message.subject = subject;
        return dynamicFields.render(message.body);
      }).then(function(body) {
        return message.body = body;
      }).then(function() {
        return renderBehindAhead(message);
      }).then(function(message) {
        return renderBDC(message, sprint.bdcBase64, useCid);
      }).then(function(message) {
        return renderTo(message);
      });
    }
  };
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('NotSoShitty.daily-report').factory('DailyReport', function(Parse) {
  var DailyReport;
  return DailyReport = (function(_super) {
    __extends(DailyReport, _super);

    function DailyReport() {
      return DailyReport.__super__.constructor.apply(this, arguments);
    }

    DailyReport.configure("DailyReport", "project", "message");

    DailyReport.getByProject = function(project) {
      return this.query({
        where: {
          project: {
            __type: "Pointer",
            className: "Project",
            objectId: project.objectId
          }
        }
      }).then(function(response) {
        if (response.length > 0) {
          return response[0];
        } else {
          return null;
        }
      });
    };

    return DailyReport;

  })(Parse.Model);
});

angular.module('NotSoShitty.login').run(function(Permission, localStorageService, GAuth) {
  Permission.defineRole('trello-authenticated', function() {
    return localStorageService.get('trello_token') != null;
  });
  return Permission.defineRole('google-authenticated', function() {
    return GAuth.checkAuth();
  });
});

angular.module('NotSoShitty.login').config(function($stateProvider) {
  return $stateProvider.state('trello-login', {
    url: '/login/trello',
    controller: 'TrelloLoginCtrl',
    templateUrl: 'login/states/trello/view.html'
  }).state('tab.google-login', {
    url: '/login/google',
    controller: 'GoogleLoginCtrl',
    templateUrl: 'login/states/google/view.html'
  });
});



angular.module('NotSoShitty.settings').config(function($stateProvider) {
  return $stateProvider.state('tab.project', {
    url: '/project',
    controller: 'ProjectCtrl',
    templateUrl: 'project/states/main/view.html',
    resolve: {
      user: function(NotSoShittyUser, localStorageService, $state) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          if (user == null) {
            localStorageService.clearAll();
            $state.go('trello-login');
          }
          return user;
        });
      },
      boards: function(TrelloClient) {
        return TrelloClient.get('/members/me/boards').then(function(response) {
          return response.data;
        });
      }
    },
    data: {
      permissions: {
        only: ['trello-authenticated'],
        redirectTo: 'trello-login'
      }
    }
  });
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('NotSoShitty.storage').factory('Project', function(Parse, $q) {
  var Project;
  return Project = (function(_super) {
    __extends(Project, _super);

    function Project() {
      return Project.__super__.constructor.apply(this, arguments);
    }

    Project.configure("Project", "boardId", "name", "columnMapping", "team", "currentSprint", "settings");

    Project.get = function(boardId) {
      var deferred;
      deferred = $q.defer();
      if (boardId != null) {
        this.query({
          where: {
            boardId: boardId
          }
        }).then(function(projectsArray) {
          var project;
          project = projectsArray.length > 0 ? projectsArray[0] : null;
          return deferred.resolve(project);
        })["catch"](deferred.reject);
      } else {
        deferred.reject('No boardId');
      }
      return deferred.promise;
    };

    return Project;

  })(Parse.Model);
});

angular.module('NotSoShitty.bdc').config(function($stateProvider) {
  return $stateProvider.state('tab.current-sprint', {
    url: '/sprint/current',
    controller: 'CurrentSprintCtrl',
    templateUrl: 'sprint/states/current-sprint/view.html',
    resolve: {
      sprint: function(NotSoShittyUser, Sprint) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return Sprint.getActiveSprint(user.project);
        })["catch"](function(err) {
          console.log(err);
          return null;
        });
      },
      project: function(NotSoShittyUser, Project) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return Project.find(user.project.objectId);
        }).then(function(project) {
          return project;
        })["catch"](function(err) {
          console.log(err);
          return null;
        });
      }
    }
  }).state('tab.new-sprint', {
    url: '/sprint/edit',
    controller: 'EditSprintCtrl',
    templateUrl: 'sprint/states/edit/view.html',
    resolve: {
      project: function(NotSoShittyUser, Project) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return new Project(user.project);
        })["catch"](function(err) {
          console.log(err);
          return null;
        });
      },
      sprint: function(NotSoShittyUser, Project, Sprint) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          var info;
          return new Sprint({
            project: new Project(user.project)
          }, info = {
            bdcTitle: 'Burndown Chart'
          }, {
            number: null,
            goal: null,
            doneColumn: null,
            dates: {
              start: null,
              end: null,
              days: []
            },
            resources: {
              matrix: [],
              speed: null,
              totalPoints: null
            },
            isActive: false
          });
        });
      }
    }
  }).state('tab.edit-sprint', {
    url: '/sprint/:sprintId/edit',
    controller: 'EditSprintCtrl',
    templateUrl: 'sprint/states/edit/view.html',
    resolve: {
      project: function(NotSoShittyUser, Project) {
        return NotSoShittyUser.getCurrentUser().then(function(user) {
          return new Project(user.project);
        })["catch"](function(err) {
          console.log(err);
          return null;
        });
      },
      sprint: function(Sprint, $stateParams, $state) {
        return Sprint.find($stateParams.sprintId)["catch"](function(err) {
          console.warn(err);
          return $state.go('tab.new-sprint');
        });
      }
    }
  });
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('NotSoShitty.storage').factory('Sprint', function(Parse) {
  var Sprint;
  return Sprint = (function(_super) {
    __extends(Sprint, _super);

    function Sprint() {
      return Sprint.__super__.constructor.apply(this, arguments);
    }

    Sprint.configure("Sprint", "project", "number", "dates", "resources", "bdcData", "isActive", "doneColumn", "bdcBase64", "goal");

    Sprint.getActiveSprint = function(project) {
      return this.query({
        where: {
          project: {
            __type: "Pointer",
            className: "Project",
            objectId: project.objectId
          },
          isActive: true
        }
      }).then(function(sprints) {
        var sprint;
        sprint = sprints.length > 0 ? sprints[0] : null;
        return sprint;
      })["catch"](function(err) {
        return console.warn(err);
      });
    };

    Sprint.close = function(sprint) {
      sprint.isActive = false;
      return sprint.save();
    };

    return Sprint;

  })(Parse.Model);
});

angular.module('NotSoShitty.bdc').factory('BDCDataProvider', function() {
  var initializeBDC;
  initializeBDC = function(days, resources) {
    var bdc, day, i, standard, _i, _len;
    standard = 0;
    bdc = [];
    for (i = _i = 0, _len = days.length; _i < _len; i = ++_i) {
      day = days[i];
      bdc.push({
        date: moment(day.date).toDate(),
        standard: standard,
        done: null
      });
      standard += _.sum(resources.matrix[i]) * resources.speed;
    }
    bdc.push({
      date: moment(day.date).add(1, 'days').toDate(),
      standard: standard,
      done: null
    });
    return bdc;
  };
  return {
    initializeBDC: initializeBDC
  };
});

angular.module('NotSoShitty.bdc').service('svgToPng', function() {
  return {
    getPngBase64: function(svg) {
      var canvas, ctx, height, img, serializer, svgStr, width;
      img = new Image();
      serializer = new XMLSerializer();
      svgStr = serializer.serializeToString(svg);
      img.src = 'data:image/svg+xml;base64,' + window.btoa(svgStr);
      canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      width = svg.offsetWidth;
      height = svg.offsetHeight;
      canvas.width = svg.offsetWidth;
      canvas.height = svg.offsetHeight;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    }
  };
});

angular.module('NotSoShitty.bdc').service('sprintUtils', function() {
  return {
    generateDayList: function(start, end) {
      var current, day, days, endM;
      if (!((start != null) && (end != null))) {
        return;
      }
      current = moment(start);
      endM = moment(end).add(1, 'days');
      if (!endM.isAfter(current)) {
        return;
      }
      days = [];
      while (!current.isSame(endM)) {
        day = current.isoWeekday();
        if (day !== 6 && day !== 7) {
          days.push({
            date: current.format()
          });
        }
        current.add(1, 'days');
      }
      return days;
    },
    generateResources: function(days, devTeam) {
      var day, line, matrix, member, _i, _j, _len, _len1;
      if (!((days != null) && (devTeam != null))) {
        return;
      }
      matrix = [];
      for (_i = 0, _len = days.length; _i < _len; _i++) {
        day = days[_i];
        line = [];
        for (_j = 0, _len1 = devTeam.length; _j < _len1; _j++) {
          member = devTeam[_j];
          line.push(1);
        }
        matrix.push(line);
      }
      return matrix;
    },
    getTotalManDays: function(matrix) {
      var cell, line, total, _i, _j, _len, _len1;
      if (matrix == null) {
        matrix = [];
      }
      total = 0;
      for (_i = 0, _len = matrix.length; _i < _len; _i++) {
        line = matrix[_i];
        for (_j = 0, _len1 = line.length; _j < _len1; _j++) {
          cell = line[_j];
          total += cell;
        }
      }
      return total;
    },
    calculateTotalPoints: function(totalManDays, speed) {
      return totalManDays * speed;
    },
    calculateSpeed: function(totalPoints, totalManDays) {
      if (!(totalManDays > 0)) {
        return;
      }
      return totalPoints / totalManDays;
    },
    generateBDC: function(days, resources, previous) {
      var bdc, date, day, fetchDone, i, standard, _i, _len;
      if (previous == null) {
        previous = [];
      }
      standard = 0;
      bdc = [];
      fetchDone = function(date) {
        var dayFromPrevious, done;
        dayFromPrevious = _.find(previous, function(elt) {
          return moment(elt.date).format() === moment(date).format();
        });
        return done = dayFromPrevious != null ? dayFromPrevious.done : null;
      };
      for (i = _i = 0, _len = days.length; _i < _len; i = ++_i) {
        day = days[i];
        date = moment(day.date).toDate();
        bdc.push({
          date: date,
          standard: standard,
          done: fetchDone(date)
        });
        standard += _.sum(resources.matrix[i]) * resources.speed;
      }
      date = moment(day.date).add(1, 'days').toDate();
      bdc.push({
        date: date,
        standard: standard,
        done: fetchDone(date)
      });
      return bdc;
    }
  };
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('NotSoShitty.storage').factory('NotSoShittyUser', function(Parse, $q, TrelloClient, Project, localStorageService) {
  var NotSoShittyUser;
  return NotSoShittyUser = (function(_super) {
    __extends(NotSoShittyUser, _super);

    function NotSoShittyUser() {
      return NotSoShittyUser.__super__.constructor.apply(this, arguments);
    }

    NotSoShittyUser.configure("NotSoShittyUser", "email", "project");

    NotSoShittyUser.getCurrentUser = function() {
      return this.query({
        where: {
          email: localStorageService.get('trello_email')
        },
        include: 'project'
      }).then(function(user) {
        if (user.length > 0) {
          return user[0];
        } else {
          return null;
        }
      });
    };

    NotSoShittyUser.getBoardId = function() {
      var deferred, token;
      deferred = $q.defer();
      token = localStorageService.get('trello_token');
      if (token == null) {
        deferred.reject('No token');
      }
      TrelloClient.get('/member/me').then(function(response) {
        return response.data;
      }).then(function(userInfo) {
        return UserBoard.query({
          where: {
            email: userInfo.email
          }
        });
      }).then(function(userBoards) {
        if (userBoards.length > 0) {
          return deferred.resolve(userBoards[0].boardId);
        } else {
          return deferred.resolve(null);
        }
      });
      return deferred.promise;
    };

    NotSoShittyUser.setBoardId = function(boardId) {
      var deferred, token;
      deferred = $q.defer();
      token = localStorageService.get('trello_token');
      if (token == null) {
        deferred.reject('No token');
      }
      return TrelloClient.get('/member/me').then(function(response) {
        return response.data;
      }).then(function(userInfo) {
        return this.query({
          where: {
            email: userInfo.email
          }
        }).then(function(user) {
          var project;
          user = user.length > 0 ? user[0] : null;
          if (typeof board !== "undefined" && board !== null) {
            board.boardId = boardId;
            return board.save();
          } else {
            project = new Project();
            project.boardId = boardId;
            this.project = project;
            return this.save();
          }
        });
      });
    };

    return NotSoShittyUser;

  })(Parse.Model);
});

angular.module('NotSoShitty.storage').service('userService', function(NotSoShittyUser) {
  return {
    getOrCreate: function(email) {
      return NotSoShittyUser.query({
        where: {
          email: email
        }
      }).then(function(users) {
        var user;
        if (users.length > 0) {
          return users[0];
        } else {
          user = new User();
          user.email = email;
          return user.save().then(function(user) {
            return user;
          });
        }
      });
    }
  };
});

angular.module('NotSoShitty.common').directive('dynamicFieldsList', function() {
  return {
    restrict: 'E',
    templateUrl: 'common/directives/dynamic-fields/view.html',
    scope: {
      availableFields: '='
    }
  };
});

angular.module('NotSoShitty.common').directive('nssRound', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelController) {
      ngModelController.$parsers.push(function(data) {
        return parseFloat(data);
      });
      ngModelController.$formatters.push(function(data) {
        if (_.isNumber(data)) {
          data = data.toFixed(1);
        }
        return data;
      });
    }
  };
});

angular.module('NotSoShitty.common').factory('Avatar', function(TrelloClient) {
  return {
    getMember: function(memberId) {
      if (!memberId) {
        return;
      }
      return TrelloClient.get('/members/' + memberId).then(function(response) {
        var hash;
        if (response.data.uploadedAvatarHash) {
          hash = response.data.uploadedAvatarHash;
        } else if (response.data.avatarHash) {
          hash = response.data.avatarHash;
        } else {
          hash = null;
        }
        return {
          username: response.data.username,
          fullname: response.data.fullname,
          hash: hash,
          initials: response.data.initials
        };
      });
    }
  };
});

angular.module('NotSoShitty.common').controller('TrelloAvatarCtrl', function(Avatar, $scope) {
  var colors, getColor;
  if (!$scope.size) {
    $scope.size = '50';
  }
  $scope.$watch('member', function(member) {
    if (member == null) {
      return $scope.hash = null;
    }
    if (member.uploadedAvatarHash) {
      return $scope.hash = member.uploadedAvatarHash;
    } else if (member.avatarHash) {
      return $scope.hash = member.avatarHash;
    } else {
      return $scope.hash = null;
    }
  });
  colors = ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'];
  getColor = function(initials) {
    var hash;
    hash = initials.charCodeAt(0);
    return colors[hash % 9];
  };
  return $scope.color = getColor($scope.member.initials);
});

angular.module('NotSoShitty.common').directive('trelloAvatar', function() {
  return {
    restrict: 'E',
    templateUrl: 'common/directives/trello-avatar/view.html',
    scope: {
      size: '@',
      member: '='
    },
    controller: 'TrelloAvatarCtrl'
  };
});

angular.module('NotSoShitty.daily-report').controller('PreviewCtrl', function($scope, $mdDialog, $mdToast, mailer, message, rawMessage, reportBuilder) {
  $scope.message = message;
  $scope.hide = function() {
    return $mdDialog.hide();
  };
  $scope.cancel = function() {
    return $mdDialog.cancel();
  };
  return $scope.send = function() {
    return reportBuilder.render(rawMessage, true).then(function(message) {
      return mailer.send(message, function(response) {
        var errorFeedback, sentFeedback;
        if ((response.code != null) && response.code > 300) {
          errorFeedback = $mdToast.simple().hideDelay(3000).position('top right').content("Failed to send message: '" + response.message + "'");
          $mdToast.show(errorFeedback);
          return $mdDialog.cancel();
        } else {
          sentFeedback = $mdToast.simple().hideDelay(1000).position('top right').content('Email sent');
          $mdToast.show(sentFeedback);
          return $mdDialog.cancel();
        }
      });
    });
  };
});

angular.module('NotSoShitty.daily-report').controller('DailyReportCtrl', function($scope, $mdToast, $mdDialog, $mdMedia, mailer, reportBuilder, dailyReport, sprint) {
  var saveFeedback;
  reportBuilder.init();
  saveFeedback = $mdToast.simple().hideDelay(1000).position('top right').content('Saved!');
  $scope.dailyReport = dailyReport;
  $scope.save = function() {
    return $scope.dailyReport.save().then(function() {
      return $mdToast.show(saveFeedback);
    });
  };
  return $scope.preview = function(ev) {
    return $mdDialog.show({
      controller: 'PreviewCtrl',
      templateUrl: 'daily-report/states/preview/view.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: $mdMedia('sm'),
      resolve: {
        message: function() {
          return reportBuilder.render($scope.dailyReport.message, false);
        },
        rawMessage: function() {
          return $scope.dailyReport.message;
        },
        sprint: function() {
          return sprint;
        }
      }
    });
  };
});

angular.module('NotSoShitty.login').controller('ProfilInfoCtrl', function($rootScope, $scope, $auth, User, $state) {
  var getTrelloInfo;
  $scope.logout = function() {
    $auth.logout();
    $scope.userInfo = null;
    $state.go('trello-login');
    return $scope.showProfilCard = false;
  };
  getTrelloInfo = function() {
    if ($auth.isAuthenticated()) {
      return User.getTrelloInfo().then(function(info) {
        return $scope.userInfo = info;
      });
    }
  };
  getTrelloInfo();
  $rootScope.$on('refresh-profil', getTrelloInfo);
  $scope.showProfilCard = false;
  return $scope.toggleProfilCard = function() {
    return $scope.showProfilCard = !$scope.showProfilCard;
  };
});

angular.module('NotSoShitty.login').directive('profilInfo', function() {
  return {
    restrict: 'E',
    templateUrl: 'login/directives/profil-info/view.html',
    scope: {},
    controller: 'ProfilInfoCtrl'
  };
});

angular.module('NotSoShitty.login').controller('GoogleLoginCtrl', function($scope, GAuth) {
  return $scope.authenticate = function() {
    return GAuth.login().then(function() {
      return console.log('authenticated!');
    }, function() {
      return console.log('login fail');
    });
  };
});

angular.module('NotSoShitty.login').controller('TrelloLoginCtrl', function($scope, $rootScope, TrelloClient, $state, $auth, NotSoShittyUser, localStorageService) {
  if (localStorageService.get('trello_token')) {
    $state.go('tab.project');
  }
  return $scope.login = function() {
    return TrelloClient.authenticate().then(function(response) {
      return TrelloClient.get('/member/me');
    }).then(function(response) {
      return response.data;
    }).then(function(userInfo) {
      return localStorageService.set('trello_email', userInfo.email);
    }).then(function() {
      return NotSoShittyUser.getCurrentUser();
    }).then(function(user) {
      if (user == null) {
        user = new NotSoShittyUser();
        user.email = localStorageService.get('trello_email');
        return user.save();
      }
    }).then(function() {
      return $state.go('tab.project');
    });
  };
});

angular.module('NotSoShitty.settings').controller('ResourcesByDayCtrl', function($scope) {
  var changeResource;
  changeResource = function(dayIndex, memberIndex, matrix) {
    matrix[dayIndex][memberIndex] += 0.5;
    if (matrix[dayIndex][memberIndex] > 1) {
      matrix[dayIndex][memberIndex] = 0;
    }
    return matrix;
  };
  return $scope.resourceClick = function(i, j) {
    return $scope.matrix = angular.copy(changeResource(i, j, $scope.matrix));
  };
});

angular.module('NotSoShitty.settings').directive('resourcesByDay', function() {
  return {
    restrict: 'E',
    templateUrl: 'project/directives/resources-by-day/view.html',
    scope: {
      members: '=',
      matrix: '=',
      days: '='
    },
    controller: 'ResourcesByDayCtrl'
  };
});

var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

angular.module('NotSoShitty.settings').controller('SelectPeopleCtrl', function($scope) {
  if ($scope.teamCheck == null) {
    $scope.teamCheck = {};
  }
  $scope.toggle = function(member) {
    var m, _ref;
    if (_ref = member.id, __indexOf.call((function() {
      var _i, _len, _ref1, _results;
      _ref1 = $scope.selectedMembers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        m = _ref1[_i];
        _results.push(m.id);
      }
      return _results;
    })(), _ref) >= 0) {
      _.remove($scope.selectedMembers, function(m) {
        return m.id === member.id;
      });
      return $scope.teamCheck[member.id] = false;
    } else {
      $scope.selectedMembers.push(member);
      return $scope.teamCheck[member.id] = true;
    }
  };
  return $scope.$watch('selectedMembers', function(newVal) {
    var member, _i, _len, _ref, _results;
    if (!newVal) {
      return;
    }
    if (newVal.length > 0) {
      if ($scope.teamCheck == null) {
        $scope.teamCheck = {};
      }
      _ref = $scope.selectedMembers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        member = _ref[_i];
        _results.push($scope.teamCheck[member.id] = true);
      }
      return _results;
    } else {
      return $scope.teamCheck = {};
    }
  });
});

angular.module('NotSoShitty.settings').directive('selectPeople', function() {
  return {
    restrict: 'E',
    templateUrl: 'project/directives/select-people/view.html',
    scope: {
      members: '=',
      selectedMembers: '='
    },
    controller: 'SelectPeopleCtrl'
  };
});

angular.module('NotSoShitty.settings').controller('ProjectCtrl', function($location, $mdToast, $scope, $state, $timeout, $q, boards, TrelloClient, localStorageService, Project, user) {
  var fetchBoardData, project, promise, saveFeedback;
  $scope.boards = boards;
  if (user.project != null) {
    project = user.project;
  } else {
    project = new Project();
  }
  $scope.project = project;
  fetchBoardData = function(boardId) {
    return $q.all([
      TrelloClient.get("/boards/" + boardId + "/lists").then(function(response) {
        return $scope.boardColumns = response.data;
      })["catch"](function(err) {
        $scope.project.boardId = null;
        console.warn("Could not fetch Trello board with id " + boardId);
        return console.log(err);
      }), TrelloClient.get("/boards/" + boardId + "/members?fields=avatarHash,fullName,initials,username").then(function(response) {
        return $scope.boardMembers = response.data;
      })["catch"](function(err) {
        $scope.project.boardId = null;
        console.warn("Could not fetch Trello board members");
        return console.log(err);
      }), Project.get(boardId).then(function(response) {
        if (response != null) {
          return response;
        }
        console.log("No project with boardId " + boardId + " found. Creating a new one");
        project = new Project();
        project.boardId = boardId;
        project.team = {
          rest: [],
          dev: []
        };
        return project.save();
      }).then(function(project) {
        return $scope.project = project;
      })
    ]);
  };
  if ($scope.project.boardId != null) {
    fetchBoardData($scope.project.boardId);
  }
  $scope.$watch('project.boardId', function(next, prev) {
    if (!((next != null) && next !== prev)) {
      return;
    }
    return fetchBoardData(next);
  });
  $scope.clearTeam = function() {
    $scope.project.team.rest = [];
    $scope.project.team.dev = [];
    return $scope.save();
  };
  saveFeedback = $mdToast.simple().hideDelay(1000).position('top right').content('Saved!');
  promise = null;
  $scope.save = function() {
    if ($scope.project.boardId == null) {
      return;
    }
    return $scope.project.save().then(function(p) {
      user.project = p;
      return user.save().then(function() {
        $mdToast.show(saveFeedback);
        return $state.go('tab.current-sprint');
      });
    });
  };
});

angular.module('NotSoShitty.bdc').directive('burndown', function() {
  return {
    restrict: 'AE',
    scope: {
      data: '='
    },
    templateUrl: 'sprint/directives/burndown/view.html',
    link: function(scope, elem, attr) {
      var computeDimensions, config, maxWidth, whRatio;
      maxWidth = 1000;
      whRatio = 0.54;
      computeDimensions = function() {
        var config, height, width;
        if (window.innerWidth > maxWidth) {
          width = 800;
        } else {
          width = window.innerWidth * 0.8;
        }
        height = whRatio * width;
        if (height + 128 > window.innerHeight) {
          height = window.innerHeight * 0.8;
          width = height / whRatio;
        }
        config = {
          containerId: '#bdcgraph',
          width: width,
          height: height,
          margins: {
            top: 30,
            right: 70,
            bottom: 60,
            left: 50
          },
          colors: {
            standard: '#D93F8E',
            done: '#5AA6CB',
            good: '#97D17A',
            bad: '#FA6E69',
            labels: '#113F59'
          },
          startLabel: 'Start',
          endLabel: 'Ceremony',
          dateFormat: '%A',
          xTitle: '',
          dotRadius: 4,
          standardStrokeWidth: 2,
          doneStrokeWidth: 2,
          goodSuffix: ' :)',
          badSuffix: ' :('
        };
        return config;
      };
      config = computeDimensions();
      window.onresize = function() {
        config = computeDimensions();
        return renderBDC(scope.data, config);
      };
      return scope.$watch('data', function(data) {
        if (!data) {
          return;
        }
        return renderBDC(data, config);
      }, true);
    }
  };
});

angular.module('NotSoShitty.bdc').controller('CurrentSprintCtrl', function($scope, $state, $mdDialog, $mdMedia, sprintUtils, TrelloClient, trelloUtils, dynamicFields, svgToPng, sprint, project, Sprint) {
  var DialogController, day, _i, _len, _ref, _ref1;
  if (sprint == null) {
    $state.go('tab.new-sprint');
  }
  $scope.sprint = sprint;
  dynamicFields.project(project);
  dynamicFields.sprint(sprint);
  if (sprint.bdcData != null) {
    _ref = sprint.bdcData;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      day = _ref[_i];
      day.date = moment(day.date).toDate();
    }
  }
  sprint.bdcData = sprintUtils.generateBDC(sprint.dates.days, sprint.resources, sprint.bdcData);
  dynamicFields.render((_ref1 = project.settings) != null ? _ref1.bdcTitle : void 0).then(function(title) {
    return $scope.bdcTitle = title;
  });
  $scope.bdcData = sprint.bdcData;
  $scope.showConfirmNewSprint = function(ev) {
    var confirm;
    confirm = $mdDialog.confirm().title('Start a new sprint').textContent('Starting a new sprint will end this one').targetEvent(ev).ok('OK').cancel('Cancel');
    return $mdDialog.show(confirm).then(function() {
      return Sprint.close(sprint).then(function() {
        return $state.go('tab.new-sprint');
      });
    });
  };
  $scope.openBDCMenu = function($mdOpenMenu, ev) {
    var originatorEv;
    originatorEv = ev;
    return $mdOpenMenu(ev);
  };
  $scope.openEditTitle = function(ev) {
    var useFullScreen;
    useFullScreen = $mdMedia('sm' || $mdMedia('xs'));
    return $mdDialog.show({
      controller: DialogController,
      templateUrl: 'sprint/states/current-sprint/editBDCTitle.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      resolve: {
        title: function() {
          var _ref2;
          return (_ref2 = project.settings) != null ? _ref2.bdcTitle : void 0;
        },
        availableFields: function() {
          return dynamicFields.getAvailableFields();
        }
      }
    }).then(function(title) {
      if (project.settings == null) {
        project.settings = {};
      }
      project.settings.bdcTitle = title;
      return project.save().then(function(project) {
        var _ref2;
        return dynamicFields.render((_ref2 = project.settings) != null ? _ref2.bdcTitle : void 0);
      }).then(function(title) {
        return $scope.bdcTitle = title;
      });
    });
  };
  $scope.openEditBDC = function(ev) {
    var useFullScreen;
    useFullScreen = $mdMedia('sm' || $mdMedia('xs'));
    return $mdDialog.show({
      controller: 'EditBDCCtrl',
      templateUrl: 'sprint/states/current-sprint/editBDC.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      resolve: {
        data: function() {
          return angular.copy(sprint.bdcData);
        },
        doneColumn: function() {
          return sprint.doneColumn;
        }
      }
    }).then(function(data) {
      var svg;
      sprint.bdcData = data;
      svg = d3.select('#bdcgraph')[0][0].firstChild;
      sprint.bdcBase64 = svgToPng.getPngBase64(svg);
      return sprint.save();
    });
  };
  return DialogController = function($scope, $mdDialog, title, availableFields) {
    $scope.title = title;
    $scope.availableFields = availableFields;
    $scope.hide = function() {
      return $mdDialog.hide();
    };
    $scope.cancel = function() {
      return $mdDialog.cancel();
    };
    return $scope.save = function() {
      return $mdDialog.hide($scope.title);
    };
  };
});

angular.module('NotSoShitty.bdc').controller('EditBDCCtrl', function($scope, $mdDialog, data, trelloUtils, doneColumn) {
  var getCurrentDayIndex;
  $scope.data = data;
  getCurrentDayIndex = function(data) {
    var day, i, _i, _len;
    for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
      day = data[i];
      if (day.done == null) {
        return i;
      }
    }
  };
  $scope.currentDayIndex = getCurrentDayIndex($scope.data);
  $scope.hide = function() {
    return $mdDialog.hide();
  };
  $scope.cancel = function() {
    return $mdDialog.cancel();
  };
  $scope.save = function() {
    return $mdDialog.hide($scope.data);
  };
  return $scope.fetchTrelloDonePoints = function() {
    if (doneColumn != null) {
      return trelloUtils.getColumnPoints(doneColumn).then(function(points) {
        return $scope.data[$scope.currentDayIndex].done = points;
      });
    }
  };
});

angular.module('NotSoShitty.bdc').controller('EditSprintCtrl', function($scope, $timeout, $state, TrelloClient, project, sprintUtils, sprint, Project) {
  var day, isActivable, promise, _i, _len, _ref, _ref1;
  $scope.project = project;
  if (sprint.bdcData != null) {
    _ref = sprint.bdcData;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      day = _ref[_i];
      day.date = moment(day.date).toDate();
    }
    sprint.dates.start = moment(sprint.dates.start).toDate();
    sprint.dates.end = moment(sprint.dates.end).toDate();
  }
  $scope.sprint = sprint;
  TrelloClient.get("/boards/" + project.boardId + "/lists").then(function(response) {
    return $scope.boardLists = response.data;
  });
  $scope.devTeam = (_ref1 = project.team) != null ? _ref1.dev : void 0;
  promise = null;
  $scope.saveLabel = $state.is('tab.new-sprint') ? 'Start the sprint' : 'Save';
  $scope.title = $state.is('tab.new-sprint') ? 'NEW SPRINT' : 'EDIT SPRINT';
  $scope.save = function() {
    if (isActivable()) {
      return $scope.sprint.save();
    }
  };
  $scope.activable = false;
  isActivable = function() {
    var s;
    s = $scope.sprint;
    if ((s.number != null) && (s.doneColumn != null) && (s.dates.start != null) && (s.dates.end != null) && s.dates.days.length > 0 && s.resources.matrix.length > 0 && (s.resources.totalPoints != null) && (s.resources.speed != null)) {
      return true;
    } else {
      return false;
    }
  };
  $scope.activate = function() {
    if (isActivable()) {
      $scope.sprint.isActive = true;
      return $scope.sprint.save().then(function() {
        return $state.go('tab.current-sprint');
      });
    }
  };
  $scope.$watch('sprint.dates.end', function(newVal, oldVal) {
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if (newVal == null) {
      return;
    }
    return $scope.sprint.dates.days = sprintUtils.generateDayList($scope.sprint.dates.start, $scope.sprint.dates.end);
  });
  $scope.$watch('sprint.dates.days', function(newVal, oldVal) {
    var _base, _ref2;
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if ((_base = $scope.sprint).resources == null) {
      _base.resources = {};
    }
    return $scope.sprint.resources.matrix = sprintUtils.generateResources((_ref2 = $scope.sprint.dates) != null ? _ref2.days : void 0, $scope.devTeam);
  });
  $scope.$watch('sprint.resources.matrix', function(newVal, oldVal) {
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if (!newVal) {
      return;
    }
    return $scope.sprint.resources.totalManDays = sprintUtils.getTotalManDays(newVal);
  });
  $scope.$watch('sprint.resources.totalManDays', function(newVal, oldVal) {
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if (!(newVal && newVal > 0)) {
      return;
    }
    return $scope.sprint.resources.speed = sprintUtils.calculateSpeed($scope.sprint.resources.totalPoints, newVal);
  });
  $scope.$watch('sprint.resources.totalPoints', function(newVal, oldVal) {
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if (!((newVal != null) && newVal > 0)) {
      return;
    }
    return $scope.sprint.resources.speed = sprintUtils.calculateSpeed(newVal, $scope.sprint.resources.totalManDays);
  });
  return $scope.$watch('sprint.resources.speed', function(newVal, oldVal) {
    $scope.activable = isActivable();
    if (newVal === oldVal) {
      return;
    }
    if (!((newVal != null) && newVal > 0)) {
      return;
    }
    return $scope.sprint.resources.totalPoints = sprintUtils.calculateTotalPoints($scope.sprint.resources.totalManDays, newVal);
  });
});