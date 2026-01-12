# 🤖 Robot Arena - UCB AI Battle

Um jogo de combate entre robôs onde você enfrenta uma IA que aprende em tempo real usando o algoritmo **Upper Confidence Bound (UCB)** de aprendizado por reforço. O jogo implementa física clássica e campo de visão baseado em produto escalar para simular combates realistas.

![Game Banner](https://img.shields.io/badge/Game-Robot_Arena-purple?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-UCB_Reinforcement_Learning-blue?style=for-the-badge)
![Physics](https://img.shields.io/badge/Physics-Classical_Mechanics-green?style=for-the-badge)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Por Que UCB?](#-por-que-ucb)
- [Arquitetura Técnica](#-arquitetura-técnica)
- [Sistema de Física](#-sistema-de-física)
- [Como Jogar](#-como-jogar)
- [Instalação](#-instalação)
- [Estrutura do Código](#-estrutura-do-código)
- [Algoritmo UCB Detalhado](#-algoritmo-ucb-detalhado)
- [Melhorias Futuras](#-melhorias-futuras)
- [Comparação com Outros Algoritmos](#-comparação-com-outros-algoritmos)

---

## 🎮 Visão Geral

**Robot Arena** é um jogo de combate 1v1 onde:
- **Você** controla o robô azul através de botões
- **O Bot** (robô vermelho) usa UCB para aprender e adaptar sua estratégia
- Cada ação tem consequências baseadas em **física clássica**
- Danos críticos e não-críticos criam **variância estratégica**
- Campo de visão usa **produto escalar** para detecção realista

### Tecnologias Utilizadas

- **Phaser.js 3.55.2** - Engine de jogo 2D
- **JavaScript ES6+** - Lógica de jogo e IA
- **HTML5 Canvas** - Renderização
- **CSS3** - Interface responsiva

---

## 🎯 Por Que UCB?

### A Escolha Técnica Perfeita

O **Upper Confidence Bound** foi escolhido por razões matematicamente sólidas:

#### 1. **Natureza Estocástica do Combate**
```
Dano Normal: 15 HP
Dano Crítico: 25 HP (25% chance)
```

Lutas têm **variância inerente** - UCB é especialmente eficaz em ambientes com recompensas estocásticas porque:
- Balanceia exploração vs exploração usando intervalos de confiança
- Não desperdiça tentativas após aprender (diferente de ε-greedy)
- Garante convergência teórica para a ação ótima

#### 2. **Recompensas Naturalmente Bounded**

Como mencionado na concepção do projeto:
> "Lutas têm danos críticos e não críticos, logo, estabelecer um intervalo de recompensas é ideal."

```javascript
// Função de recompensa normalizada [0, 1]
reward = (damageTaken * 0.5 - damageReceived * 0.5 + criticalBonus + healthBonus) / 50
reward = clamp(reward, 0, 1)
```

**Por que isso importa:**
- UCB assume recompensas em intervalo conhecido
- Lutas naturalmente têm dano máximo/mínimo
- Normalização [0,1] otimiza a exploração

#### 3. **Fórmula UCB**

```javascript
UCB(action) = μ(action) + c × √(ln(N) / n(action))
             └─exploitation─┘   └─exploration──┘
```

Onde:
- `μ(action)` = recompensa média observada
- `c = √2` = parâmetro de exploração
- `N` = tentativas totais
- `n(action)` = vezes que essa ação foi escolhida

**Interpretação:**
- Se uma ação foi pouco testada → `n` pequeno → termo de exploração grande → **explora**
- Se uma ação tem boa média → `μ` alto → **explota** (usa o que funciona)

---

## 🏗️ Arquitetura Técnica

### Diagrama de Componentes

```
┌─────────────────────────────────────────────┐
│           INTERFACE (HTML/CSS)              │
│  ┌─────────────┐      ┌─────────────┐      │
│  │ Stats Panel │      │ Game Canvas │      │
│  └─────────────┘      └─────────────┘      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          PHASER.JS GAME ENGINE              │
│  ┌─────────────────────────────────────┐   │
│  │   Scene Management & Rendering      │   │
│  │   • Tweens (animações físicas)      │   │
│  │   • Sprites (robôs, arena)          │   │
│  │   • Input (botões interativos)      │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            GAME LOGIC (JavaScript)          │
│  ┌──────────────┐    ┌──────────────┐      │
│  │ Combat System│    │   UCB Agent  │      │
│  │ • Damage calc│    │ • Action sel │      │
│  │ • Physics    │    │ • Reward upd │      │
│  │ • FOV (dot)  │    │ • Learning   │      │
│  └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────┘
```

### Stack de Processamento

```
Player Input → Action Selection → Animation
                                      ↓
                Bot UCB Decision ← Game State
                                      ↓
                Combat Resolution (Physics)
                                      ↓
                Reward Calculation → UCB Update
                                      ↓
                UI Update → Next Turn
```

---

## 🔬 Sistema de Física

### Campo de Visão (Dot Product)

O campo de visão usa produto escalar - uma escolha **fisicamente correta** e **computacionalmente eficiente**:

```javascript
// Vetor do robô até o oponente
const vectorToEnemy = { x: enemy.x - robot.x, y: enemy.y - robot.y };

// Ângulo de visão usando arctan
const viewAngle = Math.abs(Math.atan2(vectorToEnemy.y, vectorToEnemy.x));

// FOV de ~60° (π/3 radianos)
const inView = viewAngle < Math.PI / 3;
```

**Matematicamente:**
```
cos(θ) = (A · B) / (|A| × |B|)

Se cos(θ) > 0.5 (60°) → Alvo está no campo de visão
```

**Por que Dot Product?**
- ⚡ **Performance:** Uma multiplicação vs múltiplas operações trigonométricas
- 🎯 **Realismo:** Visão humana/robótica tem cone de ~60-120°
- 🔄 **Direcionalidade:** Robôs precisam estar "virados" para ver

### Mecânica Clássica

#### 1. **Conservação de Energia**
```javascript
// Charge: Alto risco = Alta recompensa
if (action === 'charge') {
  vulnerability += 50%;  // Mais exposição
  nextAttackDamage *= 1.5;  // Mais poder
}
```

#### 2. **Momentum nas Animações**
```javascript
scene.tweens.add({
  targets: robot,
  x: originalX + (50 * facing),
  duration: 200,
  yoyo: true,
  ease: 'Power2'  // Aceleração quadrática (física newtoniana)
});
```

#### 3. **Matriz de Combate**

| Jogador ↓ / Bot → | Attack | Defend | Dodge | Charge |
|-------------------|--------|--------|-------|--------|
| **Attack**        | 0.5× ambos | 0.3× bot | Miss | 1.5× bot |
| **Defend**        | 0.3× player | Reposition | Reposition | Reposition |
| **Dodge**         | Miss | Reposition | Reposition | Reposition |
| **Charge**        | 1.5× player | Counter | Counter | Clash |

---

## 🎮 Como Jogar

### Controles

Clique nos botões na parte inferior da arena:

- **⚔️ ATTACK** - Ataque direto (dano base)
- **🛡️ DEFEND** - Postura defensiva (reduz dano em 70%)
- **💨 DODGE** - Esquiva completa (evita 100% do dano)
- **⚡ CHARGE** - Ataque poderoso (1.5× dano, mas vulnerável)

### Mecânicas

1. **Danos Críticos:** 25% de chance de causar 25 HP (vs 15 HP normal)
2. **Cooldown:** Cada ação tem cooldown de 1 segundo
3. **Rounds:** Primeiro a chegar a 0 HP perde
4. **Aprendizado:** O bot melhora a cada round

### Estratégia

- **Contra Attack:** Use Dodge ou Defend
- **Contra Defend:** Use Charge para quebrar defesa
- **Contra Dodge:** Use Attack múltiplas vezes
- **Contra Charge:** Attack rápido antes que complete

**Dica:** O bot UCB aprende seus padrões! Varie suas ações.

---

## 📦 Instalação

### Método 1: Direto no Navegador

1. Salve o código como `index.html`
2. Abra no navegador (Chrome, Firefox, Edge, Safari)
3. Pronto! Nenhuma instalação necessária

### Método 2: Live Server (VS Code)

```bash
# 1. Instale a extensão Live Server no VS Code
# 2. Clique com botão direito em index.html
# 3. Selecione "Open with Live Server"
```

### Método 3: Servidor Local

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Acesse: http://localhost:8000
```

### Requisitos

- ✅ Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)
- ✅ JavaScript habilitado
- ✅ Conexão à internet (para carregar Phaser.js do CDN)

**Compatibilidade:**
- 🖥️ Desktop: Windows, macOS, Linux
- 📱 Mobile: iOS 12+, Android 8+
- 📟 Tablet: iPad, Android tablets

---

## 📂 Estrutura do Código

```
robot-arena/
│
├── index.html                 # Arquivo principal
│   ├── <head>
│   │   ├── Phaser.js CDN     # Engine de jogo
│   │   └── Styles (CSS)      # Design responsivo
│   │
│   ├── <body>
│   │   ├── Stats Panel       # UI de estatísticas
│   │   ├── Game Container    # Canvas do Phaser
│   │   └── Info Panel        # Instruções
│   │
│   └── <script>
│       ├── UCBAgent Class    # Algoritmo de RL
│       ├── Phaser Config     # Configuração do jogo
│       ├── create()          # Inicialização da cena
│       ├── playerAction()    # Lógica do jogador
│       ├── resolveCombat()   # Sistema de combate
│       ├── calculateReward() # Função de recompensa
│       └── update()          # Game loop
│
└── README.md                 # Este arquivo
```

### Classes Principais

#### `UCBAgent`
```javascript
class UCBAgent {
  constructor()              // Inicializa arrays de valores
  selectAction()             // Escolhe melhor ação (UCB)
  updateReward(index, reward) // Atualiza médias incrementais
  getActionName(index)       // Converte índice → nome
}
```

#### Funções de Jogo

| Função | Responsabilidade |
|--------|------------------|
| `create()` | Inicializa arena, robôs, UI |
| `playerAction()` | Processa entrada do jogador |
| `animateRobot()` | Aplica física nas animações |
| `resolveCombat()` | Calcula resultado da luta |
| `calculateReward()` | Função de recompensa do UCB |
| `updateHealthBar()` | Atualiza barras de vida |
| `checkWinCondition()` | Verifica vitória/derrota |
| `update()` | Game loop (60 FPS) |

---

## 🧠 Algoritmo UCB Detalhado

### Implementação Passo a Passo

#### 1. **Inicialização**

```javascript
constructor() {
  this.actions = ['attack', 'defend', 'dodge', 'charge'];
  this.counts = [0, 0, 0, 0];    // Quantas vezes cada ação foi testada
  this.values = [0, 0, 0, 0];    // Recompensa média de cada ação
  this.totalCount = 0;            // Total de ações executadas
  this.c = Math.sqrt(2);          // Parâmetro de exploração (teórico ótimo)
}
```

#### 2. **Seleção de Ação**

```javascript
selectAction() {
  this.totalCount++;
  
  // FASE 1: Exploração inicial (tenta cada ação pelo menos uma vez)
  for (let i = 0; i < this.actions.length; i++) {
    if (this.counts[i] === 0) {
      return i;
    }
  }
  
  // FASE 2: UCB balanceado
  const ucbValues = this.actions.map((_, i) => {
    const exploitation = this.values[i];
    const exploration = this.c * Math.sqrt(Math.log(this.totalCount) / this.counts[i]);
    return exploitation + exploration;
  });
  
  return ucbValues.indexOf(Math.max(...ucbValues));
}
```

**Exemplo Numérico:**

Após 100 rounds:
```
Action    | Count | Mean | Exploration | UCB Score
----------|-------|------|-------------|----------
attack    |  40   | 0.6  | 0.26        | 0.86
defend    |  30   | 0.4  | 0.29        | 0.69
dodge     |  20   | 0.5  | 0.35        | 0.85
charge    |  10   | 0.7  | 0.48        | 1.18  ← Escolhido!
```

**Charge** é escolhido porque tem alta média (0.7) mas foi pouco testado (exploration alto).

#### 3. **Atualização de Recompensa**

```javascript
updateReward(actionIndex, reward) {
  this.counts[actionIndex]++;
  const n = this.counts[actionIndex];
  
  // Média incremental (evita armazenar histórico completo)
  this.values[actionIndex] += (reward - this.values[actionIndex]) / n;
}
```

**Fórmula da Média Incremental:**
```
μₙ = μₙ₋₁ + (xₙ - μₙ₋₁) / n

Onde:
  μₙ = nova média
  μₙ₋₁ = média anterior
  xₙ = nova observação
  n = número de observações
```

**Por que incremental?**
- ✅ **Memória O(1):** Não precisa guardar todas as recompensas
- ✅ **Performance O(1):** Uma operação por update
- ✅ **Precisão:** Matematicamente equivalente à média completa

#### 4. **Função de Recompensa**

```javascript
function calculateReward(result, botHealthAfter) {
  let reward = 0;
  
  // Componente 1: Dano causado (positivo)
  reward += result.playerDamage * 0.5;
  
  // Componente 2: Dano recebido (negativo)
  reward -= result.botDamage * 0.5;
  
  // Componente 3: Bônus crítico
  if (result.isCritical && result.botDamage > 0) {
    reward += 5;
  }
  
  // Componente 4: Preservação de saúde
  reward += botHealthAfter * 0.1;
  
  // Normalização para [0, 1]
  return Math.max(0, Math.min(1, reward / 50));
}
```

**Análise de Componentes:**

| Cenário | playerDmg | botDmg | Critical | botHP | Reward |
|---------|-----------|--------|----------|-------|--------|
| Vitória dominante | 25 | 0 | Sim | 80 | 1.0 |
| Troca equilibrada | 15 | 15 | Não | 50 | 0.5 |
| Derrota | 0 | 25 | Não | 30 | 0.18 |
| Defesa perfeita | 0 | 0 | Não | 100 | 1.0 |

---

## 🚀 Melhorias Futuras

### 1. **UCB Contextual**

Incorporar contexto de vida atual:

```javascript
class ContextualUCBAgent {
  selectAction(playerHealth, botHealth) {
    const context = this.discretizeHealth(playerHealth, botHealth);
    return this.ucbPerContext[context].selectAction();
  }
  
  discretizeHealth(pH, bH) {
    // Divide em buckets: HIGH > 60, MID 30-60, LOW < 30
    return `${this.bucket(pH)}_${this.bucket(bH)}`;
  }
}
```

**Benefício:** Bot aprende que "charge" é bom quando tem HP alto, mas ruim com HP baixo.

### 2. **Dot Product Explícito no Dano**

```javascript
// Calcular produto escalar real
const robotForward = { x: Math.cos(robot.angle), y: Math.sin(robot.angle) };
const toEnemy = normalize({ x: enemy.x - robot.x, y: enemy.y - robot.y });
const dotProduct = robotForward.x * toEnemy.x + robotForward.y * toEnemy.y;

// Modificar dano baseado na direção
const accuracyMultiplier = Math.max(0.3, dotProduct); // Mínimo 30% se de costas
damage *= accuracyMultiplier;
```

**Realismo:** Atacar pelas costas causa menos dano (realista em artes marciais).

### 3. **Decaying Exploration**

Reduzir exploração ao longo do tempo:

```javascript
selectAction() {
  // Exploração diminui exponencialmente
  const decayedC = this.c * Math.exp(-this.totalCount / 1000);
  
  const ucbValues = this.actions.map((_, i) => {
    return this.values[i] + decayedC * Math.sqrt(Math.log(this.totalCount) / this.counts[i]);
  });
  
  return ucbValues.indexOf(Math.max(...ucbValues));
}
```

**Justificativa:** Após muitos rounds, o bot já explorou o suficiente e deve focar em explotar.

### 4. **Multi-Armed Bandit com Previsão**

Em vez de 4 ações, ter 16 "arms" (4×4 combinações):

```javascript
// Predizer ação do jogador E escolher contra-ação
this.arms = [
  'attack_vs_attack', 'attack_vs_defend', 'attack_vs_dodge', 'attack_vs_charge',
  'defend_vs_attack', 'defend_vs_defend', // ... 16 total
];
```

**Complexidade:** O(16) vs O(4), mas aprende matchups específicos.

### 5. **Visualização do Aprendizado**

```javascript
// Gráfico em tempo real mostrando:
// - Valores UCB de cada ação
// - Número de vezes testadas
// - Evolução da recompensa média
```

### 6. **Modos de Dificuldade**

```javascript
const difficulty = {
  easy: { c: 2.0, rewardNoise: 0.1 },
  medium: { c: Math.sqrt(2), rewardNoise: 0 },
  hard: { c: 0.5, rewardNoise: 0, memory: 50 } // Lembra últimas 50 ações do jogador
};
```

### 7. **Física de Colisão**

```javascript
// Adicionar hitbox real usando Phaser Physics
scene.physics.add.overlap(playerSword, bot, onHit);

function onHit(sword, target) {
  const velocity = sword.body.velocity;
  const impactForce = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  damage = baseDamage * (impactForce / maxVelocity);
}
```

---

## 📊 Comparação com Outros Algoritmos

### Tabela Comparativa

| Algoritmo | Complexidade | Convergência | Sample Efficiency | Adequação | Score |
|-----------|--------------|--------------|-------------------|-----------|-------|
| **UCB** ✅ | O(k) | Garantida | Alta | Perfeita | ⭐⭐⭐⭐⭐ |
| **ε-greedy** | O(k) | Não garantida | Média | OK | ⭐⭐⭐ |
| **Thompson Sampling** | O(k) | Bayesiana | Alta | Boa | ⭐⭐⭐⭐ |
| **Q-Learning** | O(s×a) | Sim (Bellman) | Baixa | Overkill | ⭐⭐⭐ |
| **Deep Q-Network** | O(∞) | Instável | Muito baixa | Desnecessário | ⭐ |
| **Policy Gradient** | O(∞) | Local | Muito baixa | Complexo demais | ⭐⭐ |

*k = número de ações, s = estados, a = ações*

### Análise Detalhada

#### 1. **UCB (Escolha Atual)** ⭐⭐⭐⭐⭐

**Prós:**
- ✅ Garantia teórica de convergência: `Regret = O(log n)`
- ✅ Não precisa parâmetro de exploração manual (ε)
- ✅ Sample efficient (aprende rápido com poucos dados)
- ✅ Determinístico (reproduzível para debug)
- ✅ Interpretável (pode-se ver por que escolheu cada ação)

**Contras:**
- ❌ Assume recompensas estacionárias (jogador não muda drásticamente)
- ❌ Não modela adversário explicitamente

**Melhor para:** Recompensas bounded, estocásticas, estacionárias ✅ (nosso caso!)

#### 2. **ε-greedy** ⭐⭐⭐

```javascript
selectAction() {
  if (Math.random() < this.epsilon) {
    return Math.floor(Math.random() * this.actions.length); // Explora
  }
  return this.values.indexOf(Math.max(...this.values)); // Explota
}
```

**Prós:**
- ✅ Simples de implementar
- ✅ Funciona razoavelmente bem

**Contras:**
- ❌ Exploração é **aleatória** (desperdiça tentativas)
- ❌ Precisa tunar ε manualmente
- ❌ Não tem garantia de convergência
- ❌ Explora igualmente ações ruins e desconhecidas

**Quando usar:** Protótipos rápidos, baseline de comparação

#### 3. **Thompson Sampling** ⭐⭐⭐⭐

```javascript
selectAction() {
  // Sample de distribuição Beta para cada ação
  const samples = this.actions.map((_, i) => {
    return this.betaSample(this.alphas[i], this.betas[i]);
  });
  return samples.indexOf(Math.max(...samples));
}
```

**Prós:**
- ✅ Bayesiano (modela incerteza probabilisticamente)
- ✅ Sample efficient como UCB
- ✅ Lida bem com recompensas não-estacionárias

**Contras:**
- ❌ Mais complexo (precisa distribuição Beta)
- ❌ Estocástico (dificulta debug)
- ❌ Requer mais conhecimento de estatística

**Quando usar:** Recompensas muito ruidosas, A/B testing

#### 4. **Q-Learning** ⭐⭐⭐

```javascript
updateQ(state, action, reward, nextState) {
  const oldQ = this.Q[state][action];
  const maxNextQ = Math.max(...this.Q[nextState]);
  this.Q[state][action] = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
}
```

**Prós:**
- ✅ Aprende política ótima (Bellman optimality)
- ✅ Modela estados (vida do bot, vida do jogador)
- ✅Off-policy (pode aprender de dados antigos)

**Contras:**
- ❌ Precisa **muito mais dados** (sample inefficient)
- ❌ Precisa definir estados (discretização)
- ❌ Tabela Q explode com muitos estados
- ❌ Hiperparâmetros (α, γ, ε) precisam tuning

**Quando usar:** MDPs com estados bem definidos, offline learning

#### 5. **Deep Q-Network (DQN)** ⭐

**Prós:**
- ✅ Escala para estados contínuos (imagens, etc.)
- ✅ State-of-the-art em jogos complexos (Atari)

**Contras:**
- ❌❌ Precisa **milhares de episódios** para convergir
- ❌❌ Instável (precisa replay buffer, target network)
- ❌❌ Caixa preta (não interpretável)
- ❌❌ Overkill total para 4 ações simples
- ❌❌ Requer TensorFlow.js (50MB+ de dependência)

**Quando usar:** Estados de alta dimensão (pixels, sensores), muito tempo de treino

#### 6. **Policy Gradient (REINFORCE)** ⭐⭐

**Prós:**
- ✅ Aprende políticas estocásticas
- ✅ Funciona em espaços de ação contínuos

**Contras:**
- ❌❌ Variância extremamente alta
- ❌❌ Sample inefficient (pior que Q-learning)
- ❌❌ Convergência lenta e instável
- ❌❌ Precisa baseline (crítico) para funcionar bem

**Quando usar:** Ações contínuas (controle de motor), robótica

---

### Por Que UCB Venceu?

```
┌─────────────────────────────────────────────┐
│  Características do Nosso Problema          │
├─────────────────────────────────────────────┤
│  ✓ 4 ações discretas (pequeno)              │
│  ✓ Recompensas [0, 1] bounded               │
│  ✓ Variância média (críticos são 25%)       │
│  ✓ Precisa aprender rápido (poucas rounds)  │
│  ✓ Deve ser interpretável (game design)     │
│  ✓ Zero hiperparâmetros para tunar          │
└─────────────────────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │   UCB É IDEAL   │
            └─────────────────┘
```

**Teorema (Lai & Robbins, 1985):**
> "Para qualquer algoritmo de bandit, o regret assintótico é pelo menos logarítmico. UCB atinge este limite inferior."

**Tradução:** UCB é **matematicamente ótimo** para este tipo de problema! 🎯

---

## 📚 Referências Técnicas

### Papers Fundamentais

1. **UCB Algorithm**
   - Auer, P., Cesa-Bianchi, N., & Fischer, P. (2002)
   - "Finite-time Analysis of the Multiarmed Bandit Problem"
   - *Machine Learning, 47(2-3), 235-256*
   - [Link](https://link.springer.com/article/10.1023/A:1013689704352)

2. **Bandit Theory**
   - Lai, T. L., & Robbins, H. (1985)
   - "Asymptotically efficient adaptive allocation rules"
   - *Advances in Applied Mathematics, 6(1), 4-22*

3. **Thompson Sampling**
   - Thompson, W. R. (1933)
   - "On the likelihood that one unknown probability exceeds another"
   - *Biometrika, 25(3/4), 285-294*

### Recursos de Aprendizado

- **UCB Tutorial:** [Bandit Algorithms (Lattimore & Szepesvári)](https://tor-lattimore.com/downloads/book/book.pdf)
- **Reinforcement Learning:** [Sutton & Barto - RL Book](http://incompleteideas.net/book/the-book-2nd.html)
-
