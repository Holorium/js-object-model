const sinon = require('sinon');
const JOM = require('../index');

describe('Librarys', function () {

    it('has basic support', function () {
        const lib = new JOM.Library();

        lib.should.have.property('createClass');
        lib.should.have.property('getClass');
        lib.should.have.property('link');
        lib.should.have.property('extend');
        lib.should.have.property('inherit');
        lib.should.have.property('attribute');
        lib.should.have.property('on');
        lib.should.have.property('off');
        lib.should.have.property('toJSON');
        lib.should.have.property('fromJSON');
    });

    it('can create classes', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');

        Game.should.have.property('on');
        Game.should.have.property('link');
        Game.should.have.property('attribute');
        Game.should.have.property('extend');
    });

    it('cannot create two classes with the same name in one library', function () {
        const lib = new JOM.Library();
        lib.createClass('Game');

        expect(lib.createClass.bind(lib, 'Game')).to.throw();
    });

    it('can create classes with getClass', function () {
        const lib = new JOM.Library();
        const Game = lib.getClass('Game');

        Game.should.have.property('on');
        Game.should.have.property('link');
        Game.should.have.property('attribute');
        Game.should.have.property('extend');
    });

    it('can get existing classes with getClass', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');
        const Same = lib.getClass('Game');

        Game.should.equal(Same);
    });

    it('can use link', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        lib.link({ class: Field, arity: '1', name: 'prev' }, { class: Field, arity: '1', name: 'next' });

        var field = new Field();
        field.should.have.property('prev');
        field.should.have.property('next');
    });

    it('can use attribute', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        lib.attribute(Field, 'pos', 'Number');

        var field = new Field();
        field.should.have.property('pos');
    });

    it('can can extend properties', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');
        const start = sinon.spy();
        lib.extend(Game, {
            start: start,
            name: 'test',
        });
        var game = new Game();
        game.should.have.property('start');
        game.name.should.equal('test');
        game.start();
        start.should.have.been.calledOnce;
    });

    it('can inherit', function () {
        const lib = new JOM.Library();
        const Field = lib.createClass('Field');
        Field.prototype.name = 'field';
        const SpecialField = lib.inherit(Field, 'SuperField');
        const specialField = new SpecialField();
        specialField.should.have.property('name');
        specialField.name.should.equal('field');
        SpecialField.prototype.name = 'superfield';
        const anotherField = new SpecialField();
        anotherField.should.have.property('name');
        anotherField.name.should.equal('superfield');
    });

    it('cannot inherit to existing class', function () {
        const lib = new JOM.Library();
        const Game = lib.createClass('Game');

        expect(lib.inherit.bind(lib, Game, 'Game')).to.throw();
    });

    describe('throws events', function () {

        it('when a model is created', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const createClassListener = sinon.spy();
            const allListener = sinon.spy();
            lib.on('init', createClassListener);
            lib.on('all', allListener);

            const game = new Game();

            createClassListener.should.have.been.calledWith('Game', game);
            createClassListener.should.have.been.calledOnce;
            allListener.should.have.been.calledWith('init', 'Game', game);
            allListener.should.have.been.calledOnce;
        });

        it('when a model value changes', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            Game.attribute('pos', 'Number');
            const changeListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            lib.on('change', changeListener);
            lib.on('all', allListener);

            game.pos = 2;

            changeListener.should.have.been.calledWith('pos', 2, undefined, game);
            changeListener.should.have.been.calledOnce;
            allListener.should.have.been.calledWith('change', 'pos', 2, undefined, game);
            allListener.should.have.been.calledOnce;
        });

        it('when a model is added to a list', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const Player = lib.createClass('Player');
            Game.link(Player, '1-*');
            const addListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            const player = new Player();
            lib.on('addto', addListener);
            lib.on('all', allListener);

            game.players.push(player);

            addListener.should.have.been.calledWith('players', player, 0, game);
            allListener.should.have.been.calledTwice;
        });

        it('when a model is removed from a list', function () {
            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const Player = lib.createClass('Player');
            Game.link(Player, '1-*');
            const removeListener = sinon.spy();
            const allListener = sinon.spy();
            const game = new Game();
            const player = new Player();
            game.players.push(player);
            lib.on('removefrom', removeListener);
            lib.on('all', allListener);

            game.players.remove(player);

            removeListener.should.have.been.calledWith('players', player, 0, game);
            allListener.should.have.been.calledTwice;
        });

    });

    describe('clones', function () {

        it('Arrays with objects', function () {
            const origin = [{ test: 123 }];
            const result = JOM.Library.clone(origin);

            result.should.deep.equal([{ test: 123 }]);
            origin.should.not.equal(result);
            origin[0].should.not.equal(result[0]);
        });

        it('classes by names', function () {
            const Game = JOM.createClass('Game');
            const origin = [Game];
            const result = JOM.Library.clone(origin);

            result.should.deep.equal(['Game']);
        });

    });

    function stringify(classes = [], attributes = [], links = [], extensions = []) {
        return JSON.stringify({
            classes,
            attributes,
            links,
            extensions,
        });
    }

    describe('can export a datamodel', function () {

        describe('via lib.', function () {

            it('should convert classes', function () {
                const lib = new JOM.Library();
                lib.createClass('Game');

                lib.toJSON().should.equal(stringify(['Game']));
            });

            it('should convert simple links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                lib.link(Game, Map, '1-1');

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ class: 'Game', arity: '1', name: 'game' }, { class: 'Map', arity: '1', name: 'map' }]]));
            });

            it('should convert complex links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                lib.link({ class: Game, arity: '1', name: 'linktomap' }, { class: Map, arity: '1', name: 'linktogame' });

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ class: 'Game', arity: '1', name: 'linktomap' }, { class: 'Map', arity: '1', name: 'linktogame' }]]));
            });

            it('should convert attributes', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.attribute(Game, 'running', 'boolean');

                lib.toJSON().should.equal(stringify(['Game'], [['Game', 'running', 'boolean']]));
            });

            it('should convert extensions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.extend(Game, { running: true });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', { running: true }]]));
            });

            it('should not convert extended functions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                lib.extend(Game, { test: function() {} });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', {}]]));
            });

        });

        describe('via class.', function () {

            function stringify(classes = [], attributes = [], links = [], extensions = []) {
                return JSON.stringify({
                    classes,
                    attributes,
                    links,
                    extensions,
                });
            }

            it('should convert simple links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                Game.link(Map, '1-1');

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ class: 'Game', arity: '1', name: 'game' }, { class: 'Map', arity: '1', name: 'map' }]]));
            });

            it('should convert complex links', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                const Map = lib.createClass('Map');
                Game.link({ arity: '1', name: 'linktogame' }, { class: Map, arity: '1', name: 'linktomap' });

                lib.toJSON().should.equal(stringify(['Game', 'Map'], [], [[{ arity: '1', name: 'linktogame', class: 'Game' }, { class: 'Map', arity: '1', name: 'linktomap' }]]));
            });

            it('should convert attributes', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.attribute('running', 'boolean');

                lib.toJSON().should.equal(stringify(['Game'], [['Game', 'running', 'boolean']]));
            });

            it('should convert extensions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.extend({ running: true });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', { running: true }]]));
            });

            it('should not convert extended functions', function () {
                const lib = new JOM.Library();
                const Game = lib.createClass('Game');
                Game.extend({ test: function() {} });

                lib.toJSON().should.equal(stringify(['Game'], [], [], [['Game', {}]]));
            });

        });

    });

    describe('creates library from json', function () {

        it('parses classes', function () {
            const lib = new JOM.Library();
            lib.fromJSON(stringify(['Game']));

            // check if class exists by listening to this error
            expect(lib.createClass.bind(lib, 'Game')).to.throw();
        });

        it('parses attributes', function () {
            const lib = new JOM.Library();
            lib.fromJSON(stringify(['Game'], [['Game', 'running', 'boolean']]));

            const Game = lib.getClass('Game');
            const game = new Game();
            game.should.have.property('running');
        });

        it('parses simple links', function () {
            const lib = new JOM.Library();
            lib.fromJSON(stringify(['Game', 'Player'], [], [['Game', 'Player', '1-1']]));

            const Game = lib.getClass('Game');
            const game = new Game();
            const Player = lib.getClass('Player');
            const player = new Player();
            game.should.have.property('player');
            player.should.have.property('game');
        });

        it('parses complex links', function () {
            const lib = new JOM.Library();
            lib.fromJSON(stringify(['Game', 'Player'], [], [[{ class: 'Game', arity: '1', name: 'linktogame' }, { class: 'Player', arity: '*', name: 'linktoplayers' }]]));

            const Game = lib.getClass('Game');
            const game = new Game();
            const Player = lib.getClass('Player');
            const player = new Player();

            game.should.have.property('linktoplayers');
            player.should.have.property('linktogame');
        });

        it('parses extensions', function () {
            const lib = new JOM.Library();
            lib.fromJSON(stringify(['Game'], [], [], [['Game', { test: '1' }]]));

            const Game = lib.getClass('Game');
            const game = new Game();
            game.test.should.equal('1');
        });

    });

    describe('provides a datamodel', function () {

        it('has functions', function () {
            const lib = new JOM.Library();
            const datamodel = lib.getDataModel();

            datamodel.should.have.property('registerClass');
            datamodel.should.have.property('registerModel');
            datamodel.should.have.property('on');
            datamodel.should.have.property('off');
            datamodel.should.have.property('getByID');

        });

        it('contains models', function () {
            const lib = new JOM.Library();
            const Game = lib.getClass('Game');
            new Game();

            const datamodel = lib.getDataModel();
            expect(datamodel.getByID('Game@0')).not.to.be.undefined;
        });

        it('with clone function', function () {

            const lib = new JOM.Library();
            const Game = lib.createClass('Game');
            const Map = lib.createClass('Map');
            const Player = lib.createClass('Player');
            Game.link(Map, '1-1');
            Game.link(Player, '1-*');
            Game.attribute('running', 'boolean');

            const game = new Game();
            const map = new Map();
            const player1 = new Player();
            const player2 = new Player();
            game.map = map;
            game.players.push(player1, player2);
            game.running = true;

            lib.getDataModel().clone(game).should.deep.equal({
                map: 'Map@1',
                players: ['Player@2', 'Player@3'],
                running: true,
            });

        });

        it('with clone function that works with inheritance', function () {
            // TODO
        });

    });

    describe('streams', function () {

        it('the datamodel', function () {
            const lib1 = new JOM.Library();
            lib1.createClass('Game');

            const lib2 = new JOM.Library();
            lib2.toJSON().should.equal(stringify());

            lib1.toStream(lib2.fromStream);

            lib2.toJSON().should.equal(stringify(['Game']));
        });

        it('initial models', function () {
            const lib1 = new JOM.Library();
            const Game = lib1.createClass('Game');
            new Game();

            const lib2 = new JOM.Library();
            expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;

            lib1.toStream(lib2.fromStream);

            expect(lib2.getDataModel().getByID('Game@0')).not.to.be.undefined;
        });

        it('model creations', function () {
            const lib1 = new JOM.Library();
            const Game = lib1.createClass('Game');

            const lib2 = new JOM.Library();

            lib1.toStream(lib2.fromStream);

            expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;

            new Game();

            expect(lib2.getDataModel().getByID('Game@0')).not.to.be.undefined;
        });

        it('updates', function () {
            const lib1 = new JOM.Library();
            const Game = lib1.createClass('Game');
            Game.attribute('running', 'boolean');

            const gameInLib1 = new Game();
            gameInLib1.running = false;

            const lib2 = new JOM.Library();

            lib1.toStream(lib2.fromStream);

            const gameInLib2 = lib2.getDataModel().getByID('Game@0');
            expect(gameInLib2).not.to.be.undefined;
            gameInLib2.running.should.equal(false);

            // update
            gameInLib1.running = true;

            gameInLib2.running.should.equal(true);
        });

        describe('links', function () {

            it('intial', function () {
                const lib1 = new JOM.Library();
                const Game = lib1.createClass('Game');
                const Map = lib1.createClass('Map');
                Game.link(Map, '1-1');

                const game = new Game();
                const map = new Map();
                game.map = map;

                const lib2 = new JOM.Library();
                lib1.toStream(lib2.fromStream);

                const gameIn2 = lib2.getDataModel().get('Game@0');
                const mapIn2 = lib2.getDataModel().get('Map@1');
                gameIn2.map.should.equal(mapIn2);
                mapIn2.game.should.equal(gameIn2);
            });

            it('one to one', function () {
                const lib1 = new JOM.Library();
                const Game = lib1.createClass('Game');
                const Map = lib1.createClass('Map');
                Map.link(Game, '1-1');

                const game = new Game();
                const map = new Map();

                const lib2 = new JOM.Library();
                lib1.toStream(lib2.fromStream);

                const gameIn2 = lib2.getDataModel().get('Game@0');
                const mapIn2 = lib2.getDataModel().get('Map@1');

                expect(gameIn2.map).to.be.undefined;
                expect(mapIn2.game).to.be.undefined;

                game.map = map;

                gameIn2.map.should.equal(mapIn2);
                mapIn2.game.should.equal(gameIn2);

            });

            describe('one to many', function () {

                it('add', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game');
                    const Player = lib1.createClass('Player');
                    Game.link(Player, '1-*');

                    const game = new Game();
                    const player1 = new Player();
                    const player2 = new Player();
                    game.players.push(player1);

                    const lib2 = new JOM.Library();
                    lib1.toStream(lib2.fromStream);

                    const gameIn2 = lib2.getDataModel().get('Game@0');
                    const player1In2 = lib2.getDataModel().get('Player@1');
                    const player2In2 = lib2.getDataModel().get('Player@2');

                    gameIn2.players.should.deep.equal([player1In2]);

                    game.players.push(player2);

                    gameIn2.players.should.deep.equal([player1In2, player2In2]);
                });

                it('remove', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game');
                    const Player = lib1.createClass('Player');
                    Game.link(Player, '1-*');

                    const game = new Game();
                    const player1 = new Player();
                    const player2 = new Player();
                    game.players.push(player1, player2);

                    const lib2 = new JOM.Library();
                    lib1.toStream(lib2.fromStream);

                    const gameIn2 = lib2.getDataModel().get('Game@0');
                    const player1In2 = lib2.getDataModel().get('Player@1');
                    const player2In2 = lib2.getDataModel().get('Player@2');

                    gameIn2.players.should.deep.equal([player1In2, player2In2]);

                    game.players.remove(player1);

                    game.players.should.deep.equal([player2]);
                    gameIn2.players.should.deep.equal([player2In2]);
                });
            });

            describe('with client=false', function () {

                it('the datamodel', function () {
                    const lib1 = new JOM.Library();
                    lib1.createClass('Game', { client: false });

                    const lib2 = new JOM.Library();
                    lib2.toJSON().should.equal(stringify());

                    lib1.toStream(lib2.fromStream);

                    lib2.toJSON().should.equal(stringify([]));
                });

                it('initial models', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game', { client: false });
                    new Game();

                    const lib2 = new JOM.Library();
                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;

                    lib1.toStream(lib2.fromStream);

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                });

                it('model creations', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game', { client: false });

                    const lib2 = new JOM.Library();

                    lib1.toStream(lib2.fromStream);

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;

                    new Game();

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                });

                it('updates', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game');
                    Game.attribute('running', 'boolean', { client: false });

                    const gameInLib1 = new Game();
                    gameInLib1.running = false;

                    const lib2 = new JOM.Library();

                    lib1.toStream(lib2.fromStream);

                    const gameInLib2 = lib2.getDataModel().getByID('Game@0');
                    expect(gameInLib2).not.to.be.undefined;
                    expect(gameInLib2.running).to.be.undefined;

                    // update
                    gameInLib1.running = true;

                    expect(gameInLib2.running).to.be.undefined;
                });

                describe('links', function () {

                    it('initial with restricted link', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Map = lib1.createClass('Map');
                        Game.link(Map, '1-1', { client: false });

                        const game = new Game();
                        const map = new Map();
                        game.map = map;

                        const lib2 = new JOM.Library();
                        lib1.toStream(lib2.fromStream);

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const mapIn2 = lib2.getDataModel().get('Map@1');
                        expect(gameIn2.map).to.be.undefined;
                        expect(mapIn2.game).to.be.undefined;
                    });

                    it('initial with restricted class', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Map = lib1.createClass('Map', { client: false });
                        Game.link(Map, '1-1');

                        const game = new Game();
                        const map = new Map();
                        game.map = map;

                        const lib2 = new JOM.Library();
                        lib1.toStream(lib2.fromStream);

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const mapIn2 = lib2.getDataModel().get('Map@1');
                        expect(gameIn2.map).to.be.undefined;
                        expect(mapIn2).to.be.undefined;
                    });

                    it('add one to many with restricted link', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Player = lib1.createClass('Player');
                        Game.link(Player, '1-*', { client: false });

                        const game = new Game();
                        const player1 = new Player();
                        const player2 = new Player();
                        game.players.push(player1);

                        const lib2 = new JOM.Library();
                        lib1.toStream(lib2.fromStream);

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const player1In2 = lib2.getDataModel().get('Player@1');
                        const player2In2 = lib2.getDataModel().get('Player@2');

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2.game).to.be.undefined;
                        expect(player2In2.game).to.be.undefined;

                        game.players.push(player2);

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2.game).to.be.undefined;
                        expect(player2In2.game).to.be.undefined;
                    });

                    it('add one to many with restricted class', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Player = lib1.createClass('Player', { client: false });
                        Game.link(Player, '1-*');

                        const game = new Game();
                        const player1 = new Player();
                        const player2 = new Player();
                        game.players.push(player1);

                        const lib2 = new JOM.Library();
                        lib1.toStream(lib2.fromStream);

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const player1In2 = lib2.getDataModel().get('Player@1');
                        const player2In2 = lib2.getDataModel().get('Player@2');

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2).to.be.undefined;
                        expect(player2In2).to.be.undefined;

                        game.players.push(player2);

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2).to.be.undefined;
                        expect(player2In2).to.be.undefined;
                    });

                });
            });

            describe('with client=function', function () {

                it('the datamodel', function () {
                    const lib1 = new JOM.Library();
                    lib1.createClass('Game', { client: opt => opt.id === 2 });

                    const lib2 = new JOM.Library();
                    const lib3 = new JOM.Library();
                    lib2.toJSON().should.equal(stringify());
                    lib3.toJSON().should.equal(stringify());

                    lib1.toStream(lib2.fromStream, { id: 1 });
                    lib1.toStream(lib3.fromStream, { id: 2 });

                    lib2.toJSON().should.equal(stringify([]));
                    lib3.toJSON().should.equal(stringify(['Game']));
                });

                it('initial models', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game', { client: opt => opt.id === 2 });
                    new Game();

                    const lib2 = new JOM.Library();
                    const lib3 = new JOM.Library();
                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                    expect(lib3.getDataModel().getByID('Game@0')).to.be.undefined;

                    lib1.toStream(lib2.fromStream, { id: 1 });
                    lib1.toStream(lib3.fromStream, { id: 2 });

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                    expect(lib3.getDataModel().getByID('Game@0')).not.to.be.undefined;
                });

                it('model creations', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game', { client: opt => opt.id === 2 });

                    const lib2 = new JOM.Library();
                    const lib3 = new JOM.Library();

                    lib1.toStream(lib2.fromStream, { id: 1 });
                    lib1.toStream(lib3.fromStream, { id: 2 });

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                    expect(lib3.getDataModel().getByID('Game@0')).to.be.undefined;

                    new Game();

                    expect(lib2.getDataModel().getByID('Game@0')).to.be.undefined;
                    expect(lib3.getDataModel().getByID('Game@0')).not.to.be.undefined;
                });

                it('updates', function () {
                    const lib1 = new JOM.Library();
                    const Game = lib1.createClass('Game');
                    Game.attribute('running', 'boolean', { client: opt => opt.id === 2 });

                    const gameInLib1 = new Game();
                    gameInLib1.running = false;

                    const lib2 = new JOM.Library();
                    const lib3 = new JOM.Library();

                    lib1.toStream(lib2.fromStream, { id: 1 });
                    lib1.toStream(lib3.fromStream, { id: 2 });

                    const gameInLib2 = lib2.getDataModel().getByID('Game@0');
                    const gameInLib3 = lib3.getDataModel().getByID('Game@0');
                    expect(gameInLib2).not.to.be.undefined;
                    expect(gameInLib2.running).to.be.undefined;
                    expect(gameInLib3).not.to.be.undefined;
                    gameInLib3.running.should.equal(false);

                    // update
                    gameInLib1.running = true;

                    expect(gameInLib2.running).to.be.undefined;
                    gameInLib3.running.should.equal(true);
                });

                describe('links', function () {

                    it('initial with restricted link', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Map = lib1.createClass('Map');
                        Game.link(Map, '1-1', { client: opt => opt.id === 2 });

                        const game = new Game();
                        const map = new Map();
                        game.map = map;

                        const lib2 = new JOM.Library();
                        const lib3 = new JOM.Library();

                        lib1.toStream(lib2.fromStream, { id: 1 });
                        lib1.toStream(lib3.fromStream, { id: 2 });

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const mapIn2 = lib2.getDataModel().get('Map@1');
                        expect(gameIn2.map).to.be.undefined;
                        expect(mapIn2.game).to.be.undefined;

                        const gameIn3 = lib3.getDataModel().get('Game@0');
                        const mapIn3 = lib3.getDataModel().get('Map@1');
                        gameIn3.map.should.equal(mapIn3);
                        mapIn3.game.should.equal(gameIn3);
                    });

                    it('initial with restricted class', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Map = lib1.createClass('Map', { client: opt => opt.id === 2 });
                        Game.link(Map, '1-1');

                        const game = new Game();
                        const map = new Map();
                        game.map = map;

                        const lib2 = new JOM.Library();
                        const lib3 = new JOM.Library();

                        lib1.toStream(lib2.fromStream, { id: 1 });
                        lib1.toStream(lib3.fromStream, { id: 2 });

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const mapIn2 = lib2.getDataModel().get('Map@1');
                        expect(gameIn2.map).to.be.undefined;
                        expect(mapIn2).to.be.undefined;

                        const gameIn3 = lib3.getDataModel().get('Game@0');
                        const mapIn3 = lib3.getDataModel().get('Map@1');
                        gameIn3.map.should.equal(mapIn3);
                        mapIn3.game.should.equal(gameIn3);
                    });

                    it('add one to many with restricted link', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Player = lib1.createClass('Player');
                        Game.link(Player, '1-*', { client: opt => opt.id === 2 });

                        const game = new Game();
                        const player1 = new Player();
                        const player2 = new Player();
                        game.players.push(player1);

                        const lib2 = new JOM.Library();
                        const lib3 = new JOM.Library();

                        lib1.toStream(lib2.fromStream, { id: 1 });
                        lib1.toStream(lib3.fromStream, { id: 2 });

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const player1In2 = lib2.getDataModel().get('Player@1');
                        const player2In2 = lib2.getDataModel().get('Player@2');

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2.game).to.be.undefined;
                        expect(player2In2.game).to.be.undefined;

                        const gameIn3 = lib3.getDataModel().get('Game@0');
                        const player1In3 = lib3.getDataModel().get('Player@1');
                        const player2In3 = lib3.getDataModel().get('Player@2');

                        gameIn3.players.should.deep.equal([player1In3]);
                        player1In3.game.should.equal(gameIn3);
                        expect(player2In3.game).to.be.undefined;

                        game.players.push(player2);

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2.game).to.be.undefined;
                        expect(player2In2.game).to.be.undefined;

                        gameIn3.players.should.deep.equal([player1In3, player2In3]);
                        player1In3.game.should.equal(gameIn3);
                        player2In3.game.should.equal(gameIn3);
                    });

                    it('add one to many with restricted class', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Player = lib1.createClass('Player', { client: opt => opt.id === 2 });
                        Game.link(Player, '1-*');

                        const game = new Game();
                        const player1 = new Player();
                        const player2 = new Player();
                        game.players.push(player1);

                        const lib2 = new JOM.Library();
                        const lib3 = new JOM.Library();

                        lib1.toStream(lib2.fromStream, { id: 1 });
                        lib1.toStream(lib3.fromStream, { id: 2 });

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const player1In2 = lib2.getDataModel().get('Player@1');
                        const player2In2 = lib2.getDataModel().get('Player@2');

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2).to.be.undefined;
                        expect(player2In2).to.be.undefined;

                        const gameIn3 = lib3.getDataModel().get('Game@0');
                        const player1In3 = lib3.getDataModel().get('Player@1');
                        const player2In3 = lib3.getDataModel().get('Player@2');

                        gameIn3.players.should.deep.equal([player1In3]);
                        player1In3.game.should.equal(gameIn3);
                        expect(player2In3.game).to.be.undefined;

                        game.players.push(player2);

                        expect(gameIn2.players).to.be.undefined;
                        expect(player1In2).to.be.undefined;
                        expect(player2In2).to.be.undefined;

                        gameIn3.players.should.deep.equal([player1In3, player2In3]);
                        player1In3.game.should.equal(gameIn3);
                        player2In3.game.should.equal(gameIn3);
                    });

                    it('distinguishes by the datamodel', function () {
                        const lib1 = new JOM.Library();
                        const Game = lib1.createClass('Game');
                        const Player = lib1.createClass('Player', { client: (opt, model) => !model || model.id === opt.id });
                        Player.attribute('id', 'Number');
                        Game.link(Player, '1-*');

                        const game = new Game();
                        const player1 = new Player();
                        player1.id = 1;
                        const player2 = new Player();
                        player2.id = 2;
                        game.players.push(player1);

                        const lib2 = new JOM.Library();
                        const lib3 = new JOM.Library();

                        lib1.toStream(lib2.fromStream, { id: 1 });
                        lib1.toStream(lib3.fromStream, { id: 2 });

                        const gameIn2 = lib2.getDataModel().get('Game@0');
                        const player1In2 = lib2.getDataModel().get('Player@1');
                        const player2In2 = lib2.getDataModel().get('Player@2');

                        gameIn2.players.should.deep.equal([player1In2]);
                        player1In2.game.should.equal(gameIn2);
                        expect(player2In2).to.be.undefined;

                        const gameIn3 = lib3.getDataModel().get('Game@0');
                        const player1In3 = lib3.getDataModel().get('Player@1');
                        const player2In3 = lib3.getDataModel().get('Player@2');

                        gameIn3.players.should.deep.equal([]);
                        expect(player1In3).to.be.undefined;
                        player2In3.should.not.be.undefined;

                        game.players.push(player2);

                        game.players.should.deep.equal([player1, player2]);

                        gameIn2.players.should.deep.equal([player1In2]);
                        player1In2.game.should.equal(gameIn2);
                        expect(player2In2).to.be.undefined;

                        gameIn3.players.should.deep.equal([player2In3]);
                        expect(player1In3).to.be.undefined;
                        player2In3.game.should.equal(gameIn3);
                    });

                });
            });

        });
    });

});
