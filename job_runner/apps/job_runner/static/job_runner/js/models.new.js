/*
    Get all objects from a paginated resource.
*/
angular.module('getAll', []).factory('getAll', function() {
    var forEach = angular.forEach;
    var extend = angular.extend;

    var getAll = function(output_list, model, offset, params, success, error) {
        var items = model.get(extend({}, params, {offset: offset}, success, error), function() {
            forEach(items.objects, function(item) {
                output_list.push(new model(item));
            });

            if (items.meta.next !== null) {
                getAll(output_list, model, items.meta.offset + items.meta.limit, params, success, error);
            }
        });
    };

    return getAll;
});


/*
    Project model.
*/
angular.module('project', ['ngResource', 'getAll']).factory('Project', function($resource, getAll) {
    var Project = $resource('/api/v1/project/:id/', {'id': '@id'});

    Project.all = function(params, success, error) {
        var output_list = [];
        getAll(output_list, Project, 0, params, success, error);
        return output_list;
    };

    return Project;
});


/*
    Worker model.
*/
angular.module('worker', ['ngResource', 'getAll', 'project']).factory('Worker', function($resource, getAll, Project) {
    var Worker = $resource('/api/v1/worker/:id/', {'id': '@id'});

    Worker.all = function(params, success, error) {
        var output_list = [];
        getAll(output_list, Worker, 0, params, success);
        return output_list;
    };

    Worker.prototype.get_project = function() {
        if (!this._project && this.project) {
            this._project = Project.get({'id': this.project.split('/').splice(-2, 1)[0]});
        }
        return this._project;
    };

    return Worker;
});


/*
    Job template model.
*/
angular.module('jobTemplate', ['ngResource', 'getAll', 'worker']).factory('JobTemplate', function($resource, getAll, Worker) {
    var JobTemplate = $resource('/api/v1/job_template/:id/', {'id': '@id'});

    JobTemplate.all = function(params, success, error) {
        var output_list = [];
        getAll(output_list, JobTemplate, 0, params, success);
        return output_list;
    };

    JobTemplate.prototype.get_worker = function() {
        if (!this._worker && this.worker) {
            this._worker = Worker.get({'id': this.worker.split('/').splice(-2, 1)[0]});
        }
        return this._worker;
    };

    return JobTemplate;
});


/*
    Job model.
*/
angular.module('job', ['ngResource', 'getAll', 'jobTemplate']).factory('Job', function($resource, getAll, JobTemplate) {
    var Job = $resource('/api/v1/job/:id/', {'id': '@id'});

    Job.all = function(params, success, error) {
        var output_list = [];
        getAll(output_list, Job, 0, params, success);
        return output_list;
    };

    Job.prototype.get_job_template = function() {
        if (!this._job_template && this.job_template) {
            this._job_template = JobTemplate.get({'id': this.job_template.split('/').splice(-2, 1)[0]});
        }
        return this._job_template;
    };

    Job.prototype.get_parent = function() {
        if (!this._parent && this.parent) {
            this._parent = Job.get({id: this.parent.split('/').splice(-2, 1)[0]});
        }
        return this._parent;
    };

    Job.prototype.get_children = function() {
        if (!this._children && this.children) {
            var children = [];
            this._children = children;
            angular.forEach(this.children, function(child_uri) {
                children.push(Job.get({id: child_uri.split('/').splice(-2, 1)[0]}));
            });
        }
        return this._children;
    };

    return Job;
});


/*
    Run model.
*/
angular.module('run', ['ngResource', 'getAll', 'job', 'jobrunner.services']).factory('Run', function($resource, getAll, Job, dtformat) {
    var Run = $resource('/api/v1/run/:id/', {'id': '@id'});

    Run.all = function(params, success, error) {
        var output_list = [];
        getAll(output_list, Run, 0, params, success);
        return output_list;
    };

    Run.prototype.get_job = function() {
        if (!this._job && this.job) {
            this._job = Job.get({id:  this.job.split('/').splice(-2, 1)[0]});
        }
        return this._job;
    };

    Run.prototype.get_duration_string = function() {
        return dtformat.formatDuration(this.start_dts, this.return_dts);
    }

    return Run;
});
