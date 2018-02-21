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

    intersects (actor) {
        const a = this;
        const b = actor;
        const distanceThreshold = (a.size + b.size) / 2;
        const distance = Math.sqrt(Math.pow(b.position.x - a.position.x, 2) + Math.pow(b.position.y - a.position.y, 2));

        return distance < distanceThreshold;
    }
}

class ActorShape extends createjs.Shape {
    constructor (actor) {
        super();

        this.actor = actor;
        
        this.graphics.beginFill(actor.color).drawCircle(0, 0, actor.size / 2);

        actor.position.watch((x, y) => {
            this.x = x;
            this.y = y;
        });
    }
}

class GaussianWalk {
    constructor ({ stage, color = 'Black', onIntersect }) {
        if (stage instanceof createjs.Stage)
            this.stage = stage;
        else
            this.stage = new createjs.Stage(stage);

        this.color = color;

        this.onIntersect = onIntersect;

        this.actors = [];

        this.advance();

        createjs.Ticker.on("tick", this.tick.bind(this));
    }

    addActor ({ inMotion = true, size = 10 }) {
        const actor = new Actor({inMotion, color: this.color, size});
        this.resetActor(actor);
        this.actors.push(actor);

        const shape = new ActorShape(actor);
        this.stage.addChild(shape);
        this.stage.update();
    }

    resetActors () {
        this.actors.forEach(actor => this.resetActor(actor));
    }

    resetActor (actor) {
        actor.position.x = Math.random() * this.stage.canvas.width;
        actor.position.y = Math.random() * this.stage.canvas.height;

        for (let a of this.actors) {
            if (actor === a)
                return;

            if (a.intersects(actor)) {
                this.resetActor(actor);

                break;
            }
        }
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

        if (this.onIntersect) {
            let intersects;

            GaussianWalk.eachCombination(this.actors, (a, b) => {
                if (a.intersects(b)) {
                    intersects = true;

                    return false;
                }
            });

            if (intersects)
                this.onIntersect(this);
        }
        
        // wait until this is done before moving again
        setTimeout(this.advance.bind(this), 1);
    }

    tick () {
        this.stage.update();
    }

    static eachCombination (array, callback) {
        for (let i = 0; i < array.length - 1; i++) {
            for (let j = i + 1; j < array.length; j++) {
                if (callback(array[i], array[j]) === false)
                    return;
            }
        }
    }
}

class Table extends createjs.Container {
    constructor ({data, width, height, color, cellPadding} = {}) {
        super();

        if (!color)
            color = 'black';

        if (!cellPadding)
            cellPadding = 0;

        this.width = width;
        this.height = height;
        this.color = color;
        this.cellPadding = cellPadding;
        this.data = data;
    }

    get data () {
        return this._data;
    }

    set data (value) {
        this._data = value;

        this.update();
    }
    
    update () { 
        this.removeAllChildren();

        const h = this.height / this._data.length;
        let y = 0;

        for (let i = 0; i < this._data.length; i++) {
            const row = this._data[i];
            const w = this.width / row.length;
            let x = 0;

            for (let j = 0; j < row.length; j++) {
                const cell = row[j];

                const rect = new createjs.Shape();
                rect.graphics.beginStroke(this.color).setStrokeStyle(2, 'black').drawRect(x, y, w, h);
                this.addChild(rect);
                
                const text = new createjs.Text(cell, "16px Arial");
                text.x = this.cellPadding + x;
                text.y = this.cellPadding + y;
                this.addChild(text);

                x += w;
            }

            y += h;
        }
    }
}

class Intersection {
    constructor () {
        this.time = new Date();
    }
}

class GaussianWalkAnalysis {
    constructor (canvas) {
        this.startTime = new Date();

        this.walks = [];
        this.stage = new createjs.Stage(canvas);
        
        this.motionIntersections = [];

        const actorSize = 400;

        this.motionWalk = new GaussianWalk({
            stage: this.stage,
            color: 'DeepSkyBlue',
            onIntersect: (walk, actor) => {
                this.motionIntersections.push(new Intersection());
                walk.resetActors();
            }
        });
        this.motionWalk.addActor({ inMotion: true, size: actorSize });
        this.motionWalk.addActor({ inMotion: true, size: actorSize });
        this.walks.push(this.motionWalk);

        this.staticIntersections = [];
        
        this.staticWalk = new GaussianWalk({
            stage: this.stage,
            color: 'Red',
            onIntersect: (walk, actor) => {
                this.staticIntersections.push(new Intersection());
                walk.resetActors();
            }
        });
        this.staticWalk.addActor({ inMotion: false, size: actorSize });
        this.staticWalk.addActor({ inMotion: true, size: actorSize });
        this.walks.push(this.staticWalk);

        this.table = new Table({ data: this.getData(), width: 200, height: 200, cellPadding: 4 });
        this.stage.addChild(this.table);

        createjs.Ticker.on("tick", this.tick.bind(this));
    }

    getData () {
        const elapsedTime = ((new Date().getTime() - this.startTime.getTime()) / 1000) + 's';
        const motionCount = this.motionIntersections.length;
        const staticCount = this.staticIntersections.length;
        let averageMotionTime, averageStaticTime, motionLast, staticLast, older;
        
        if (motionCount > 0) {
            averageMotionTime = (this.motionIntersections[motionCount - 1].time.getTime() - this.startTime.getTime()) / 1000;
            averageMotionTime /= motionCount;
            averageMotionTime += 's';

            if (motionCount > 1)
                older = this.motionIntersections[motionCount - 2].time;
            else
                older = this.startTime;

            motionLast = (this.motionIntersections[motionCount - 1].time.getTime() - older.getTime()) / 1000;
            motionLast += 's';
        } else {
            averageMotionTime = '';
            motionLast = '';
        }
        
        if (staticCount > 0) {
            averageStaticTime = (this.staticIntersections[staticCount - 1].time.getTime() - this.startTime.getTime()) / 1000;
            averageStaticTime /= staticCount;
            averageStaticTime += 's';

            if (staticCount > 1)
                older = this.staticIntersections[staticCount - 2].time;
            else
                older = this.startTime;

            staticLast = (this.staticIntersections[staticCount - 1].time.getTime() - older.getTime()) / 1000;
            staticLast += 's';
        } else {
            averageStaticTime = '';
            staticLast = '';
        }

        return [
            ['Intersections'],
            ['Elapsed Time:'],
            [elapsedTime],
            ['2 Movers', '1 Mover'],
            [this.motionIntersections.length, this.staticIntersections.length],
            ['Average'],
            [averageMotionTime, averageStaticTime],
            ['Last'],
            [motionLast, staticLast]
        ];
    }

    tick () {
        this.table.data = this.getData();
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

    const analysis = new GaussianWalkAnalysis(canvas);
}