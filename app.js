class Position {
    constructor (x = 0, y = 0) {
        this._x = x;
        this._y = y;
        this.watchers = [];
    }

    get x () {
        return this._x;
    }

    set x (value) {
        this._x = value;

        this.notifyWatchers();
    }

    get y () {
        return this._y;
    }

    set y (value) {
        this._y = value;

        this.notifyWatchers();
    }

    notifyWatchers () {
        this.watchers.forEach(watcher => watcher(this.x, this.y));
    }

    watch (watcher) {
        watcher(this.x, this.y);
        
        this.watchers.push(watcher);
    }
}

class Actor {
    constructor () {
        this.position = new Position();
    }
}

class ActorShape extends createjs.Shape {
    constructor (actor) {
        super();

        this.actor = actor;
        
        this.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);

        actor.position.watch((x, y) => {
            this.x = x;
            this.y = y;
        });
    }
}

class GaussianWalk {
    constructor (canvas, actors = 2) {
         this.stage = new createjs.Stage(canvas);
         this.actors = [];

         for (let i = 0; i < actors; i++)
            this.addActor();
    }

    addActor () {
        const actor = new Actor();
        actor.position.x = Math.random() * this.stage.canvas.width;
        actor.position.y = Math.random() * this.stage.canvas.height;
        this.actors.push(actor);

        const shape = new ActorShape(actor);
        this.stage.addChild(shape);
        this.stage.update();
    }
}

function init () {
    const canvas = document.createElement('canvas');
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    document.getElementsByTagName('body')[0].appendChild(canvas);

    new GaussianWalk(canvas);
}