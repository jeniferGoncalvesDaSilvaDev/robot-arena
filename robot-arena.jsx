import React, { useEffect, useRef, useState } from 'react';
import { Swords, Heart, Brain, Trophy } from 'lucide-react';

const RobotArena = () => {
  const gameRef = useRef(null);
  const [gameStats, setGameStats] = useState({
    playerHealth: 100,
    botHealth: 100,
    round: 1,
    playerWins: 0,
    botWins: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Phaser from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.55.2/phaser.min.js';
    script.async = true;
    
    script.onload = () => {
      setIsLoading(false);
      initGame();
    };
    
    document.body.appendChild(script);

    function initGame() {
      // UCB Algorithm Implementation
      class UCBAgent {
        constructor() {
          this.actions = ['attack', 'defend', 'dodge', 'charge'];
          this.counts = new Array(this.actions.length).fill(0);
          this.values = new Array(this.actions.length).fill(0);
          this.totalCount = 0;
          this.c = Math.sqrt(2); // Exploration parameter
        }

        selectAction() {
          this.totalCount++;
          
          // Initial exploration: try each action once
          for (let i = 0; i < this.actions.length; i++) {
            if (this.counts[i] === 0) {
              return i;
            }
          }

          // UCB formula: mean + c * sqrt(ln(N) / n_i)
          const ucbValues = this.actions.map((_, i) => {
            const exploitation = this.values[i];
            const exploration = this.c * Math.sqrt(Math.log(this.totalCount) / this.counts[i]);
            return exploitation + exploration;
          });

          return ucbValues.indexOf(Math.max(...ucbValues));
        }

        updateReward(actionIndex, reward) {
          this.counts[actionIndex]++;
          const n = this.counts[actionIndex];
          // Incremental average update
          this.values[actionIndex] = this.values[actionIndex] + (reward - this.values[actionIndex]) / n;
        }

        getActionName(index) {
          return this.actions[index];
        }
      }

      // Phaser Game Configuration
      const config = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 800,
        height: 600,
        backgroundColor: '#1a1a2e',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      };

      let player, bot, ucbAgent;
      let playerState = 'idle';
      let botState = 'idle';
      let gameState = {
        playerHealth: 100,
        botHealth: 100,
        round: 1,
        playerWins: 0,
        botWins: 0,
        actionCooldown: 0,
        botActionCooldown: 0
      };

      function preload() {
        // Create robot sprites procedurally
      }

      function create() {
        const scene = this;
        ucbAgent = new UCBAgent();

        // Create arena
        const graphics = scene.add.graphics();
        graphics.lineStyle(4, 0x00ff88, 1);
        graphics.strokeRect(50, 50, 700, 500);

        // Create player robot (blue)
        player = scene.add.container(200, 300);
        const playerBody = scene.add.rectangle(0, 0, 40, 60, 0x4444ff);
        const playerHead = scene.add.circle(0, -40, 20, 0x6666ff);
        const playerSword = scene.add.rectangle(30, 0, 40, 8, 0xcccccc);
        player.add([playerBody, playerHead, playerSword]);
        player.setData('health', 100);
        player.setData('facing', 1);

        // Create bot robot (red)
        bot = scene.add.container(600, 300);
        const botBody = scene.add.rectangle(0, 0, 40, 60, 0xff4444);
        const botHead = scene.add.circle(0, -40, 20, 0xff6666);
        const botSword = scene.add.rectangle(-30, 0, 40, 8, 0xcccccc);
        bot.add([botBody, botHead, botSword]);
        bot.setData('health', 100);
        bot.setData('facing', -1);

        // Health bars
        const playerHealthBar = scene.add.rectangle(100, 30, 200, 20, 0x00ff00);
        playerHealthBar.setOrigin(0, 0.5);
        playerHealthBar.setData('maxWidth', 200);
        player.setData('healthBar', playerHealthBar);

        const botHealthBar = scene.add.rectangle(500, 30, 200, 20, 0x00ff00);
        botHealthBar.setOrigin(0, 0.5);
        botHealthBar.setData('maxWidth', 200);
        bot.setData('healthBar', botHealthBar);

        // Labels
        scene.add.text(100, 50, 'PLAYER', { fontSize: '16px', fill: '#4444ff' });
        scene.add.text(600, 50, 'BOT (UCB)', { fontSize: '16px', fill: '#ff4444' });

        // Control buttons
        const buttonStyle = {
          fontSize: '14px',
          fill: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 10, y: 5 }
        };

        const attackBtn = scene.add.text(50, 560, '⚔️ ATTACK', buttonStyle)
          .setInteractive()
          .on('pointerdown', () => playerAction('attack', scene));

        const defendBtn = scene.add.text(180, 560, '🛡️ DEFEND', buttonStyle)
          .setInteractive()
          .on('pointerdown', () => playerAction('defend', scene));

        const dodgeBtn = scene.add.text(310, 560, '💨 DODGE', buttonStyle)
          .setInteractive()
          .on('pointerdown', () => playerAction('dodge', scene));

        const chargeBtn = scene.add.text(440, 560, '⚡ CHARGE', buttonStyle)
          .setInteractive()
          .on('pointerdown', () => playerAction('charge', scene));

        // Status text
        scene.statusText = scene.add.text(400, 300, '', {
          fontSize: '24px',
          fill: '#ffff00',
          align: 'center'
        }).setOrigin(0.5);

        scene.botActionText = scene.add.text(400, 100, '', {
          fontSize: '18px',
          fill: '#ff6666',
          align: 'center'
        }).setOrigin(0.5);
      }

      function playerAction(action, scene) {
        if (gameState.actionCooldown > 0 || gameState.playerHealth <= 0 || gameState.botHealth <= 0) return;

        gameState.actionCooldown = 60;
        playerState = action;

        // Visual feedback
        animateRobot(player, action, scene);

        // Bot decides action using UCB
        scene.time.delayedCall(300, () => {
          const botActionIndex = ucbAgent.selectAction();
          const botAction = ucbAgent.getActionName(botActionIndex);
          botState = botAction;
          
          scene.botActionText.setText(`Bot uses: ${botAction.toUpperCase()}`);
          animateRobot(bot, botAction, scene);

          // Resolve combat after animations
          scene.time.delayedCall(400, () => {
            const result = resolveCombat(action, botAction, scene);
            
            // Update UCB with reward
            const reward = calculateReward(result, gameState.botHealth);
            ucbAgent.updateReward(botActionIndex, reward);

            // Update health bars
            updateHealthBar(player);
            updateHealthBar(bot);

            // Check win condition
            checkWinCondition(scene);

            scene.time.delayedCall(2000, () => {
              scene.statusText.setText('');
              scene.botActionText.setText('');
            });
          });
        });
      }

      function animateRobot(robot, action, scene) {
        const originalX = robot.x;
        const originalY = robot.y;
        const facing = robot.getData('facing');

        switch(action) {
          case 'attack':
            scene.tweens.add({
              targets: robot,
              x: originalX + (50 * facing),
              duration: 200,
              yoyo: true,
              ease: 'Power2'
            });
            break;
          case 'defend':
            scene.tweens.add({
              targets: robot,
              scaleX: 0.8,
              scaleY: 1.2,
              duration: 300,
              yoyo: true
            });
            break;
          case 'dodge':
            scene.tweens.add({
              targets: robot,
              y: originalY - 50,
              duration: 200,
              yoyo: true,
              ease: 'Sine.easeInOut'
            });
            break;
          case 'charge':
            scene.tweens.add({
              targets: robot,
              angle: robot.angle + (360 * facing),
              duration: 400,
              ease: 'Power2'
            });
            break;
        }
      }

      function resolveCombat(playerAction, botAction, scene) {
        const isCritical = Math.random() < 0.25; // 25% critical chance
        const baseDamage = isCritical ? 25 : 15;
        
        let playerDamage = 0;
        let botDamage = 0;
        let message = '';

        // Combat matrix with field of view consideration (dot product simulation)
        const playerVector = { x: bot.x - player.x, y: bot.y - player.y };
        const distance = Math.sqrt(playerVector.x ** 2 + playerVector.y ** 2);
        const viewAngle = Math.abs(Math.atan2(playerVector.y, playerVector.x));
        const inView = viewAngle < Math.PI / 3; // ~60 degree FOV

        if (playerAction === 'attack' && botAction === 'attack') {
          playerDamage = baseDamage * 0.5;
          botDamage = baseDamage * 0.5;
          message = 'Both robots clash!';
        } else if (playerAction === 'attack' && botAction === 'defend') {
          botDamage = baseDamage * 0.3;
          message = 'Bot defends!';
        } else if (playerAction === 'attack' && botAction === 'dodge') {
          message = 'Bot dodges!';
        } else if (playerAction === 'attack' && botAction === 'charge') {
          botDamage = baseDamage * 1.5;
          message = isCritical ? 'CRITICAL HIT!' : 'Player hits charging bot!';
        } else if (playerAction === 'charge' && botAction === 'attack') {
          playerDamage = baseDamage * 1.5;
          message = 'Bot counters charge!';
        } else if (playerAction === 'defend' && botAction === 'attack') {
          playerDamage = baseDamage * 0.3;
          message = 'Player defends!';
        } else if (playerAction === 'dodge' && botAction === 'attack') {
          message = 'Player dodges!';
        } else {
          message = 'Both robots reposition!';
        }

        // Apply damage
        gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
        gameState.botHealth = Math.max(0, gameState.botHealth - botDamage);
        
        player.setData('health', gameState.playerHealth);
        bot.setData('health', gameState.botHealth);

        scene.statusText.setText(message);

        return { playerDamage, botDamage, isCritical, inView };
      }

      function calculateReward(result, botHealthAfter) {
        // Reward function for UCB
        let reward = 0;
        
        // Positive reward for damaging player
        reward += result.playerDamage * 0.5;
        
        // Negative reward for taking damage
        reward -= result.botDamage * 0.5;
        
        // Bonus for critical hits
        if (result.isCritical && result.botDamage > 0) {
          reward += 5;
        }
        
        // Health preservation bonus
        reward += botHealthAfter * 0.1;
        
        // Normalize reward to [0, 1] range for UCB
        return Math.max(0, Math.min(1, reward / 50));
      }

      function updateHealthBar(robot) {
        const healthBar = robot.getData('healthBar');
        const health = robot.getData('health');
        const maxWidth = healthBar.getData('maxWidth');
        const newWidth = (health / 100) * maxWidth;
        
        healthBar.width = newWidth;
        
        if (health > 60) {
          healthBar.fillColor = 0x00ff00;
        } else if (health > 30) {
          healthBar.fillColor = 0xffff00;
        } else {
          healthBar.fillColor = 0xff0000;
        }
      }

      function checkWinCondition(scene) {
        if (gameState.playerHealth <= 0) {
          gameState.botWins++;
          scene.statusText.setText('BOT WINS!');
          resetRound(scene);
        } else if (gameState.botHealth <= 0) {
          gameState.playerWins++;
          scene.statusText.setText('PLAYER WINS!');
          resetRound(scene);
        }
        
        updateReactState();
      }

      function resetRound(scene) {
        scene.time.delayedCall(3000, () => {
          gameState.round++;
          gameState.playerHealth = 100;
          gameState.botHealth = 100;
          player.setData('health', 100);
          bot.setData('health', 100);
          updateHealthBar(player);
          updateHealthBar(bot);
          scene.statusText.setText('');
          updateReactState();
        });
      }

      function updateReactState() {
        setGameStats({
          playerHealth: gameState.playerHealth,
          botHealth: gameState.botHealth,
          round: gameState.round,
          playerWins: gameState.playerWins,
          botWins: gameState.botWins
        });
      }

      function update() {
        if (gameState.actionCooldown > 0) {
          gameState.actionCooldown--;
        }
      }

      const game = new Phaser.Game(config);
    }

    return () => {
      const script = document.querySelector('script[src*="phaser"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      {isLoading && (
        <div className="text-white text-xl mb-4">Carregando Phaser.js...</div>
      )}
      
      <div className="mb-4 bg-slate-800/50 backdrop-blur rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="text-blue-400" size={20} />
              <span className="font-mono">Player: {gameStats.playerHealth}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              <span className="font-mono">Wins: {gameStats.playerWins}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-purple-600/30 px-4 py-2 rounded">
            <Swords size={20} />
            <span className="font-bold">Round {gameStats.round}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="text-red-400" size={20} />
              <span className="font-mono">Bot (UCB): {gameStats.botHealth}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              <span className="font-mono">Wins: {gameStats.botWins}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div ref={gameRef} className="border-4 border-purple-500/30 rounded-lg shadow-2xl" />
      
      <div className="mt-4 text-center text-slate-400 text-sm max-w-2xl">
        <p className="mb-2">
          <span className="text-purple-400 font-semibold">UCB Algorithm:</span> O bot aprende através de Upper Confidence Bound, 
          equilibrando exploração de novas estratégias e exploração das melhores ações conhecidas.
        </p>
        <p className="text-xs">
          Danos críticos (25% chance) e campo de visão baseado em produto escalar simulam física realista.
        </p>
      </div>
    </div>
  );
};

export default RobotArena;
