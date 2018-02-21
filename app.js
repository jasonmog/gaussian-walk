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
    constructor ({size = 10, inMotion = true, color = 'Black'}) {
        this.position = new Position();
        this.size = size;
        this.inMotion = inMotion;
        this.color = color;
    }
}

class ActorShape extends createjs.Shape {
    constructor (actor) {
        super();

        this.actor = actor;
        
        this.graphics.beginFill(actor.color).drawCircle(0, 0, actor.size);

        actor.position.watch((x, y) => {
            this.x = x;
            this.y = y;
        });
    }
}

class GaussianWalk {
    constructor ({ stage, color = 'Black' }) {
        if (stage instanceof createjs.Stage)
            this.stage = stage;
        else
            this.stage = new createjs.Stage(stage);

        this.color = color;

        this.actors = [];

        setInterval(this.advance.bind(this), 1);

        createjs.Ticker.on("tick", this.tick.bind(this));
    }

    addActor (inMotion = true) {
        const actor = new Actor({inMotion, color: this.color});
        actor.position.x = Math.random() * this.stage.canvas.width;
        actor.position.y = Math.random() * this.stage.canvas.height;
        this.actors.push(actor);

        const shape = new ActorShape(actor);
        this.stage.addChild(shape);
        this.stage.update();
    }

    advance () {
        for (let i = 0; i < this.actors.length; i++) {
            const actor = this.actors[i];

            if (!actor.inMotion)
                continue;

            const angle = Math.random() * 2 * Math.PI;

            const xDelta = Math.cos(angle);
            const yDelta = Math.sin(angle);

            let newX = actor.position.x + xDelta;

            if (newX < 0)
                newX = 0;
            else if (newX > this.stage.canvas.width)
                newX = this.stage.canvas.width;

            actor.position.x = newX;

            let newY = actor.position.y + yDelta;

            if (newY < 0)
                newY = 0;
            else if (newY > this.stage.canvas.height)
                newY = this.stage.canvas.height;

            actor.position.y = newY;
        }
    }

    tick () {
        this.stage.update();
    }
}

class GaussianWalkAnalysis {
    constructor (canvas) {
        this.walks = [];
        this.stage = new createjs.Stage(canvas);
        
        this.motionWalk = new GaussianWalk({ stage: this.stage, color: 'DeepSkyBlue' });
        this.motionWalk.addActor(true);
        this.motionWalk.addActor(true);
        this.walks.push(this.motionWalk);
        
        this.staticWalk = new GaussianWalk({ stage: this.stage, color: 'Red' });
        this.staticWalk.addActor(false);
        this.staticWalk.addActor(true);
        this.walks.push(this.staticWalk);
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

    const analysis = new GaussianWalkAnalysis(canvas);
}