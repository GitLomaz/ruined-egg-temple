$(document).ready(function () {
  game = new Phaser.Game(config);
});

let menuMap;
let map;
let player;
let cursors;
let eggs;
let menuPortals;
let keys;
let idleCounter = 100;
let bg;
let frameCounter = 80;
let currentZone = 0
let zoneChange = false
let totalEggs = 0;
let start;
let timer;
let exitPortal;
let times = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0
}
let spawnPoints = {
  0: {x:1200, y:5000},
  1: {x:1940, y:4350},
  2: {x:450, y:4350},
  3: {x:1940, y:2300},
  4: {x:450, y:2300},
  5: {x:1940, y:1360},
  6: {x:450, y:1360}
}


var zoneScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:
    function zoneScene() {
      Phaser.Scene.call(this, {
        key: 'zoneScene'
      });
    },

  preload: function() {
    
  },

  create: function() {
    $('#eggCounter').show();
    $('#timer').show();
    start = Date.now()
    zoneChange = false
    bg = this.add.image(600,400,'bg')
    bg.setScale(1.5, 1.5)
    bg.setScrollFactor(0)

    map = this.make.tilemap({ key: 'map-' + currentZone });
    let tiles = map.addTilesetImage('tiles')
    let newTiles = map.addTilesetImage('newTiles')
    groundLayer = map.createDynamicLayer('groundLayer', tiles, 0,0)
    map.createDynamicLayer('bricks', newTiles, 0,0)
    map.createDynamicLayer('cracks', newTiles, 0,0)
    map.createDynamicLayer('vines', newTiles, 0,0)

    // MAKE FLOOR TILES HARD AND SPRING CALLBACK
    groundLayer.setTileIndexCallback(19, spring, this);
    groundLayer.setTileIndexCallback(16, function(){
      window.clearTimeout(timer);
      $('#warning').fadeIn(200)
      timer = setTimeout(function(){
        $('#warning').fadeOut(200)
      }, 1000)
    }, this);

    // FIND STARTING POINT
    const startTileX = groundLayer.findByIndex(17).x;
    const startTileY = groundLayer.findByIndex(17).y;

    // SWAP START AND END POINTS
    this.anims.create({
      key: 'portalStart',
      frames: this.anims.generateFrameNumbers('portals', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'portalEnd',
      frames: this.anims.generateFrameNumbers('portals', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    if (groundLayer.findByIndex(17) !== null) {
      const tile = groundLayer.findByIndex(17)
      groundLayer.swapByIndex(17, 20, tile.x, tile.y, 1, 1)
      const portal = this.physics.add.sprite(tile.x * 48 + 24, tile.y * 48 + 24, 'portals')
      portal.body.setAllowGravity(false)
      portal.anims.play('portalStart', true)
    } else {
      console.log('no start point?!')
    }

    if (groundLayer.findByIndex(18) !== null) {
      const tile = groundLayer.findByIndex(18)
      groundLayer.swapByIndex(18, 16, tile.x, tile.y, 1, 1)
      exitPortal = this.physics.add.sprite(tile.x * 48 + 24, tile.y * 48 + 24, 'portals')
      exitPortal.body.setAllowGravity(false)
      exitPortal.anims.play('portalEnd', true)
    } else {
      console.log('no end point?!')
    }

    // FIND START TILE AND SPAWN PLAYER THERE
    player = this.physics.add.sprite(startTileX * 48 + 24, startTileY * 48 + 24, 'bunny');
    player.body.setSize(25,28, true)
    player.body.setMaxSpeed(1000)
    groundLayer.setCollisionBetween(1, 16)
    this.physics.add.collider(player, groundLayer);
    this.physics.add.overlap(player, exitPortal, exitZone, null, this);

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('bunny', { start: 0, end: 9 }),
      frameRate: 30,
      repeat: -1
    });
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('bunny', { start: 10, end: 19 }),
      frameRate: 30,
      repeat: -1
    });
    this.anims.create({
      key: 'center',
      frames: this.anims.generateFrameNumbers('bunny', { start: 21, end: 21 }),
      frameRate: 30,
      repeat: -1
    });

    this.anims.create({
      key: 'idle1',
      frames: this.anims.generateFrameNumbers('bunny', { start: 30, end: 37 }),
      frameRate: 30,
    });

    this.anims.create({
      key: 'idle2',
      frames: this.anims.generateFrameNumbers('bunny', { start: 37, end: 58 }),
      frameRate: 30,
    });

    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('bunny', { start: 23, end: 24 }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'downLeft',
      frames: this.anims.generateFrameNumbers('bunny', { start: 28, end: 29 }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'downRight',
      frames: this.anims.generateFrameNumbers('bunny', { start: 26, end: 27 }),
      frameRate: 15,
      repeat: -1
    });

    // SWAP ALL EGG TILES WITH EGG ENTITIES
    eggs = this.physics.add.group({allowGravity: false});
    for (let i = 0; i < 6; i++) {
      let check = true
      while (check) {
        if(groundLayer.findByIndex(21 + i) !== null) {
          const tile = groundLayer.findByIndex(21 + i)
          groundLayer.swapByIndex(21 + i, 20, tile.x, tile.y, 1, 1)
          const egg = this.physics.add.sprite(tile.x * 48 + 24, tile.y * 48 + 24, 'egg' + (i + 1))
          egg.angle = -30;
          egg.setOrigin(.5, .4);
          eggs.add(egg)
        } else {
          check = false
        }
      }
    }

    totalEggs = eggs.children.size;
    $('#eggCounter').html('0 / ' + totalEggs);


    // CREATE TWEEN TO WOBBLE EGGS
    this.tweens.addCounter({
      from: -20,
      to: 20,
      duration: 1000,
      repeat: -1,
      yoyo: 1,
      onUpdate: function (tween)
      { 
        e = eggs.getChildren()
        _.each(e, function(egg) {
          egg.setAngle(tween.getValue())
        })
      }
    });

    // CALL COLLECTEGG WHEN TOUCHED
    this.physics.add.overlap(player, eggs, function(player, egg) {
      egg.disableBody(true, true)
      eggs.remove(egg)
      $('#eggCounter').html(totalEggs - eggs.children.size + ' / ' + totalEggs);
      if (eggs.children.size === 0) {
        const tile = groundLayer.findByIndex(16)
        groundLayer.swapByIndex(16, 20, tile.x, tile.y, 1, 1)
        tile.setCollision(false, false, false, false);
      }
    }, null, this);

    // LOCK CAMERA TO USER
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.fadeIn(200);

    // ADD INPUT
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D');
  },

  update: function() {
    const millis = Date.now() - start;
    $('#timer').html(msToTime(millis))
    player.body.setVelocityX(0);
    if (player.body.velocity.y > 600) {
      player.body.setVelocityY(600);
    }
    if (cursors.left.isDown || keys.A.isDown)
    {
      player.body.setVelocityX(-200);
      idleCounter = Phaser.Math.Between(300, 600);
      if (player.body.onFloor()) {
        player.anims.play('left', true);
      } else if (Math.floor(player.body.velocity.y) > 0) {
        player.anims.play('downLeft', true);
      } else if (Math.floor(player.body.velocity.y) < -1) {
        player.anims.play('up', true);
      }
    }
    else if (cursors.right.isDown || keys.D.isDown)
    {
      player.body.setVelocityX(200);
      idleCounter = Phaser.Math.Between(300, 600);
      if (player.body.onFloor()) {
        player.anims.play('right', true);
      } else if (Math.floor(player.body.velocity.y) > 0) {
        player.anims.play('downRight', true);
      } else if (Math.floor(player.body.velocity.y) < -1) {
        player.anims.play('up', true);
      }
    } else {
      if (player.anims.currentAnim && player.body.onFloor() && (player.anims.currentAnim.key === 'left' || player.anims.currentAnim.key === 'right' || player.anims.currentAnim.key === 'up' || player.anims.currentAnim.key === 'downLeft' || player.anims.currentAnim.key === 'downRight')) {
        player.anims.play('center', true);
      } else {
        if (player.body.onFloor()) {
          idleCounter--;
          if (idleCounter === 0) {
            player.anims.play('idle' + Phaser.Math.Between(1, 2))
            idleCounter = Phaser.Math.Between(300, 600);
          }
        } else {
          if (Math.floor(player.body.velocity.y) > 0) {
            if (Math.floor(player.body.velocity.x) > 0) {
              player.anims.play('downLeft', true);
            } else {
              player.anims.play('downRight', true);
            }
          } else if (Math.floor(player.body.velocity.y) < -1) {
            player.anims.play('up', true);
          }
        }
      }
    }
    if ((cursors.space.isDown || cursors.up.isDown || keys.W.isDown) && player.body.onFloor())
    {
        player.body.setVelocityY(-400);
    }
  }
})

var titleScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:

    function titleScene() {
      Phaser.Scene.call(this, {
        key: 'titleScene'
      });
    },

  preload: function() {
    this.load.image('start', 'assets/images/start.png');
    this.load.image('bg', 'assets/images/bg.png');
    this.load.image('egg1', 'assets/images/egg1.png');
    this.load.image('egg2', 'assets/images/egg2.png');
    this.load.image('egg3', 'assets/images/egg3.png');
    this.load.image('egg4', 'assets/images/egg4.png');
    this.load.image('egg5', 'assets/images/egg5.png');
    this.load.image('egg6', 'assets/images/egg6.png');
    this.load.spritesheet('bunny', 'assets/images/bunny.png',
        { frameWidth: 64, frameHeight: 64 }
    );
    this.load.image('tiles', 'assets/images/tiles.png');
    this.load.image('newTiles', 'assets/images/newTiles-ex.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/menu.json');
    this.load.tilemapTiledJSON('map-1', 'assets/maps/zone-1.json');
    this.load.tilemapTiledJSON('map-2', 'assets/maps/zone-2.json');
    this.load.tilemapTiledJSON('map-3', 'assets/maps/zone-3.json?123');
    this.load.tilemapTiledJSON('map-4', 'assets/maps/zone-4.json');
    this.load.tilemapTiledJSON('map-5', 'assets/maps/zone-5.json');
    this.load.tilemapTiledJSON('map-6', 'assets/maps/zone-6.json');
    this.load.spritesheet('portals', 'assets/images/portals.png',
        { frameWidth: 32, frameHeight: 32 }
    );
  },

  create: function() {
    $('#eggCounter').hide();
    $('#timer').hide();
    zoneChange = false
    eggs = this.physics.add.group({allowGravity: false});

    bg = this.add.image(600,400,'bg')
    bg.setScale(1.5, 1.5)
    bg.setScrollFactor(0)
    var startBtn = this.add.image(540, 550, 'start').setInteractive()
    player = this.physics.add.sprite(550, 275, 'bunny');
    player.body.setAllowGravity(false)
    player.movingLeft = true
    player.movingDown = true
    player.notFalling = true
    let that = this
    startBtn.on('pointerover', function(pointer) {
      startBtn.setAlpha(.6);
    });
    startBtn.on('pointerdown', function(pointer) {
      if(!zoneChange) {
        zoneChange = true
        that.cameras.main.fadeOut(200);
        that.cameras.main.on('camerafadeoutcomplete', () => {
          that.scene.start('gameScene');
          zoneChange = false
        }, that);
      }
      
    });
    startBtn.on('pointerout', function(pointer) {
      startBtn.setAlpha(1);
    });


    this.anims.create({
      key: 'downLeft',
      frames: this.anims.generateFrameNumbers('bunny', { start: 28, end: 29 }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'downRight',
      frames: this.anims.generateFrameNumbers('bunny', { start: 26, end: 27 }),
      frameRate: 15,
      repeat: -1
    });    
  },

  update: function() {
    if (player.notFalling) {
      player.notFalling = false
      player.anims.play('downRight', true);
    }
    if (player.movingLeft) {
      player.x = player.x + .3;
    } else {
      player.x = player.x - .3;
    }

    if (player.movingDown) {
      player.y = player.y + .3;
    } else {
      player.y = player.y - .3;
    }

    if (player.x > 600) {
      player.movingLeft = false
    } else if (player.x < 475) {
      player.movingLeft = true
    }

    if (player.y > 320) {
      player.movingDown = false
    } else if (player.y < 200) {
      player.movingDown = true
    }

    frameCounter++

    if(frameCounter % 100 === 0) {
      let x = Phaser.Math.Between(20, 400) % 2 === 0 ? Phaser.Math.Between(20, 400) : Phaser.Math.Between(700, 1050);
      const egg = this.physics.add.sprite(x, 700, 'egg' + Phaser.Math.Between(1, 6))
      this.tweens.add({
        targets: egg,
        duration: Phaser.Math.Between(3000, 6000),
        angle: Phaser.Math.Between(20, 400) % 2 === 0 ? 360 : -360,
        ease: 'Linear',
        repeat: -1,
    });
      eggs.add(egg)
    }

    const e = eggs.getChildren()
    _.each(e, function(egg) {
      if (egg.y < -100) {
        egg.disableBody(true, true)
      } else {
        egg.y = egg.y - 2
      }
    })
  }
});

var gameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:

    function gameScene() {
      Phaser.Scene.call(this, {
        key: 'gameScene'
      });
    },

  preload: function() {

  },

  create: function() {
    $('#discord').hide();
    zoneChange = false
    bg = this.add.image(600,400,'bg')
    bg.setScale(1.5, 1.5)
    bg.setScrollFactor(0)

    menuMap = this.make.tilemap({ key: 'map' });
    let tiles = menuMap.addTilesetImage('tiles')
    let newTiles = menuMap.addTilesetImage('newTiles')
    groundLayer = menuMap.createDynamicLayer('groundLayer', tiles, 0,0)
    menuMap.createDynamicLayer('bricks', newTiles, 0,0)
    menuMap.createDynamicLayer('cracks', newTiles, 0,0)
    menuMap.createDynamicLayer('vines', newTiles, 0,0)

    // MAKE FLOOR TILES HARD AND SPRING CALLBACK
    groundLayer.setCollisionBetween(1, 16)
    groundLayer.setTileIndexCallback(19, spring, this);

    // SWAP START AND END POINTS
    this.anims.create({
      key: 'portalStart',
      frames: this.anims.generateFrameNumbers('portals', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'portalEnd',
      frames: this.anims.generateFrameNumbers('portals', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    menuPortals = this.physics.add.group({allowGravity: false});
    for (let i = 6; i > 0; i--) {
      const tile = groundLayer.findByIndex(17)
      groundLayer.swapByIndex(17, 20, tile.x, tile.y, 1, 1)
      const portal = this.physics.add.sprite(tile.x * 48 + 24, tile.y * 48 + 24, 'portals')
      portal.zoneId = i
      portal.anims.play('portalStart', true)
      menuPortals.add(portal)
    }

    // FIND START TILE AND SPAWN PLAYER THERE
    player = this.physics.add.sprite(spawnPoints[currentZone].x, spawnPoints[currentZone].y, 'bunny');
    player.body.setSize(25,28, true)
    this.physics.add.collider(player, groundLayer);

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('bunny', { start: 0, end: 9 }),
      frameRate: 30,
      repeat: -1
    });
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('bunny', { start: 10, end: 19 }),
      frameRate: 30,
      repeat: -1
    });
    this.anims.create({
      key: 'center',
      frames: this.anims.generateFrameNumbers('bunny', { start: 21, end: 21 }),
      frameRate: 30,
      repeat: -1
    });

    this.anims.create({
      key: 'idle1',
      frames: this.anims.generateFrameNumbers('bunny', { start: 30, end: 37 }),
      frameRate: 30,
    });

    this.anims.create({
      key: 'idle2',
      frames: this.anims.generateFrameNumbers('bunny', { start: 37, end: 58 }),
      frameRate: 30,
    });

    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('bunny', { start: 23, end: 24 }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'downLeft',
      frames: this.anims.generateFrameNumbers('bunny', { start: 28, end: 29 }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'downRight',
      frames: this.anims.generateFrameNumbers('bunny', { start: 26, end: 27 }),
      frameRate: 15,
      repeat: -1
    });

    // SWAP ALL EGG TILES WITH EGG ENTITIES
    eggs = this.physics.add.group({allowGravity: false});
    for (let i = 0; i < 6; i++) {
      let check = true
      while (check) {
        if(groundLayer.findByIndex(21 + i) !== null) {
          const tile = groundLayer.findByIndex(21 + i)
          groundLayer.swapByIndex(21 + i, 20, tile.x, tile.y, 1, 1)
          const egg = this.physics.add.sprite(tile.x * 48 + 24, tile.y * 48 + 24, 'egg' + (i + 1))
          egg.angle = -30;
          egg.setOrigin(.5, .4);
          eggs.add(egg)
        } else {
          check = false
        }
      }
    }


    // CREATE TWEEN TO WOBBLE EGGS
    this.tweens.addCounter({
      from: -20,
      to: 20,
      duration: 1000,
      repeat: -1,
      yoyo: 1,
      onUpdate: function (tween)
      { 
        e = eggs.getChildren()
        _.each(e, function(egg) {
          egg.setAngle(tween.getValue())
        })
      }
    });

    // CALL COLLECTEGG WHEN TOUCHED
    this.physics.add.overlap(player, eggs, function(player, egg) {
      egg.disableBody(true, true)
      eggs.remove(egg)
      if (eggs.children.size === 55) {
        const tile = groundLayer.findByIndex(16)
        groundLayer.swapByIndex(16, 20, tile.x, tile.y, 1, 1)
        groundLayer.setCollision(groundLayer.layer.collideIndexes);
      }
    }, null, this);
    this.physics.add.overlap(player, menuPortals, enterZone, null, this);

    // LOCK CAMERA TO USER
    this.cameras.main.setBounds(0, 0, menuMap.widthInPixels, menuMap.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.fadeIn(200);

    // ADD INPUT
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D');

    let that = this
    let scoreX = 1060
    let scoreY = 365
    let combinedScore = 0;
    _.each(times, function(t, index){
      if (t !== 0) {
        let x = spawnPoints[parseInt(index)].x
          if(index % 2 !== 0) {
            x = x + 65
          } else {
            x = x - 215
          }
        let y = spawnPoints[parseInt(index)].y - 175
        combinedScore += t
        that.add.text(x, y, msToTime(t),  { font: "38px", fill: "#FFFFFF", align: "center", strokeThickness: 3});
      }
      that.add.text(scoreX, scoreY, 'Zone ' + index + ': ' + msToTime(t),  { font: "30px", fill: "#333333", align: "center", strokeThickness: 2});
      scoreY += 36
    })
    scoreY += 10
    that.add.text(1050, scoreY, 'Total: ' + msToTime(combinedScore),  { font: "34px", fill: "#333333", align: "center", strokeThickness: 2});

    groundLayer.setTileIndexCallback(16, function(){
      window.clearTimeout(timer);
      $('#credits').fadeIn(200)
      timer = setTimeout(function(){
        $('#credits').fadeOut(200)
      }, 1000)
    }, this);
  },

  update: function() {
    player.body.setVelocityX(0);
    if (player.body.velocity.y > 600) {
      player.body.setVelocityY(600);
    }
    if (cursors.left.isDown || keys.A.isDown)
    {
      player.body.setVelocityX(-200);
      idleCounter = Phaser.Math.Between(300, 600);
      if (player.body.onFloor()) {
        player.anims.play('left', true);
      } else if (Math.floor(player.body.velocity.y) > 0) {
        player.anims.play('downLeft', true);
      } else if (Math.floor(player.body.velocity.y) < -1) {
        player.anims.play('up', true);
      }
    }
    else if (cursors.right.isDown || keys.D.isDown)
    {
      player.body.setVelocityX(200);
      idleCounter = Phaser.Math.Between(300, 600);
      if (player.body.onFloor()) {
        player.anims.play('right', true);
      } else if (Math.floor(player.body.velocity.y) > 0) {
        player.anims.play('downRight', true);
      } else if (Math.floor(player.body.velocity.y) < -1) {
        player.anims.play('up', true);
      }
    } else {
      if (player.anims.currentAnim && player.body.onFloor() && (player.anims.currentAnim.key === 'left' || player.anims.currentAnim.key === 'right' || player.anims.currentAnim.key === 'up' || player.anims.currentAnim.key === 'downLeft' || player.anims.currentAnim.key === 'downRight')) {
        player.anims.play('center', true);
      } else {
        if (player.body.onFloor()) {
          idleCounter--;
          if (idleCounter === 0) {
            player.anims.play('idle' + Phaser.Math.Between(1, 2))
            idleCounter = Phaser.Math.Between(300, 600);
          }
        } else {
          if (Math.floor(player.body.velocity.y) > 0) {
            if (Math.floor(player.body.velocity.x) > 0) {
              player.anims.play('downLeft', true);
            } else {
              player.anims.play('downRight', true);
            }
          } else if (Math.floor(player.body.velocity.y) < -1) {
            player.anims.play('up', true);
          }
        }
      }
    }
    if ((cursors.space.isDown || cursors.up.isDown || keys.W.isDown) && player.body.onFloor())
    {
        player.body.setVelocityY(-400);
    }
  }
});

function spring() {
  player.body.setVelocityY(-800);
}

function enterZone(player, portal) {
  if(!zoneChange) {
    zoneChange = true
    currentZone = portal.zoneId
    this.cameras.main.fadeOut(200);
    this.cameras.main.on('camerafadeoutcomplete', () => {
      this.scene.start('zoneScene');
    }, this);
  }
}

function exitZone(player, portal) {
  if(!zoneChange) {
    $('#eggCounter').hide();
    $('#timer').hide(); 
    const time = Date.now() - start
    if (times[currentZone] === 0 || times[currentZone] > time) {
      times[currentZone] = time
    } 
    zoneChange = true
    this.cameras.main.fadeOut(200);
    this.cameras.main.on('camerafadeoutcomplete', () => {
      this.scene.start('gameScene');
    }, this);
  }
}

function msToTime(duration) {
  if (duration === 0) {
    return '---';
  }
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds + "." + milliseconds;
}

var config = {
  type: Phaser.AUTO,
  width: 1108,
  height: 595,
  parent: "Game",
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 500 } }
  },
  pixelArt: false,
  scene: [titleScene, gameScene, zoneScene]
};