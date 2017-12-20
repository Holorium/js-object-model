var sinon = require('sinon'),
    JOM = require('../index');

describe('Creates classes which', function () {

    it('should have all functions', function () {
        var Game = JOM.createClass('Game'),
            Player = JOM.createClass('Player');

        JOM.link({ class: Game, arity: '1' }, { class: Player, arity: '*' });

        var game = new Game(),
            player = new Player();

        // getter and setter
        game.should.have.property('getPlayers');
        game.should.have.property('setPlayers');
        game.should.have.property('addPlayer');
        player.should.have.property('setGame');
        player.should.have.property('getGame');

        // properties
        game.should.have.property('players');

        // event emitter stuff
        Game.should.have.property('on');
        game.should.have.property('on');
        game.should.have.property('emit');
    });

    it('should respond to the init event', function () {
        var Game = JOM.createClass('Game'),
            spy = sinon.spy();
        Game.on('init', spy);
        var game = new Game();
        spy.should.have.been.calledWith(game);
    });

    it('should call the initialize function', function () {
        var Game = JOM.createClass('Game'),
            spy = sinon.spy();
        Game.prototype.initialize = spy;
        new Game();
        spy.should.have.been.calledOnce;
    });

});