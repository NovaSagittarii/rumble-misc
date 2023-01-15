let frames;
const K = 3;

const animations = {};
let animation = "idle", animationProgress = 0;
`0 60 startup idle
55 90 idle
130 160 walk_forward
165 195 walk_backward
202 220 punch_light idle
240 280 punch_heavier idle
285 350 combo_one idle
360 440 kick idle
450 465 jump idle
450 480 jump_w_land idle
480 640 kick_multi__mid_weird kick_spin
840 940 kick_spin idle
945 965 walk_backward_two__bad
1000 1020 crouch_start crouch_idle
1020 1030 crouch_idle
1030 1070 crouch_kick crouch_idle
1080 1150 crouch_end__kick_included idle
1320 1350 crouch_end idle
1350 1420 idle_taunt idle
1430 1465 stagger_1 idle
5 60 stagger_2 idle
1460 1560 knockback idle
1560 1605 block_start block_hold__alternatively_freeze
1603 1608 block_hold__alternatively_freeze
1605 1635 block_end idle
1640 1720 die_start die_loop
1720 1770 die_loop
0 5 __victory
2 5 __floss`.split('\n').forEach(line => {
	let [start, end, name, next] = (line+' ?').split(' ');
	start = Math.ceil(start/K)*K;

	if(next == "?") next = name;
	animations[name] = { start, end, next };

	const b = document.createElement('button');
	b.innerText = name;
	b.addEventListener('click', () => {
		fighters[0].updateState(name);
	});
	document.body.append(b);
});

function preload() {
	frames = {};
	frames.nate = [...new Array(Math.min(1000*K, 1770))].map((_,i) => 
		i % K == 0 &&
		loadImage(`./nate-fullanphufightsource/pred_${i.toString().padStart(8,'0')}-out.png`)
	);
	frames.saachin = [...new Array(Math.min(1000*K, 1770))].map((_,i) => 
		i % K == 0 &&
		loadImage(`./saachin-fullanphufight/pred_${i.toString().padStart(8,'0')}-out.png`)
	);

	// console.log(frames.length);

	const b = document.createElement('button');
	b.innerText = "restart";
	b.addEventListener('click', restart);
	document.body.append(b);
}
function setup() {
	createCanvas(900, 400);
	imageMode(CENTER);
	textAlign(CENTER, CENTER);
}
let keys = [];
let scoreupdate = 0;
function keyPressed(){ keys[keyCode] = true; console.log(keyCode);if(keyCode ===32)restart(); updateKeys(); }
function keyReleased(){ keys[keyCode] = false; updateKeys(); }
function updateKeys(){
	Object.entries({
		"LEFT": 65,
		"RIGHT": 68,
		"UP": 87,
		"DOWN": 83,		// wasd
		"LIGHT": 70,	// f
		"SPECIAL": 71,	// g
	}).forEach(([x,k]) => fighters[0].keys[x] = keys[k]);
	Object.entries({
		"LEFT": 37,
		"RIGHT": 39,
		"UP": 38,
		"DOWN": 40,		// arrow keys
		"LIGHT": 190,	// .
		"SPECIAL": 191, // /
	}).forEach(([x,k]) => fighters[1].keys[x] = keys[k]);
}

let fighters;
class Fighter {
	static Left = 50;
	static Right = 850;
	static Bottom = 200;
	static GRAVITY = 1;
	static JUMP = 15;
	static DRAG = 0.4;
	static HB_WIDTH = 150;
	static HB_HEIGHT = 350;
	constructor(type, sprite, x=400){
		this.type = type;
		this.actor = sprite;

		this.setup(x);
		this.score = 0;
	}
	setup(x=400){
		this.x = x;
		this.y = 0;
		this.yo = 0;
		this.flip = this.nflip = this.x > (Fighter.Left+Fighter.Right)/2;
		this.vx = 0;
		this.vy = 0;
		this.state = "startup";
		this.nextState = null;
		this.progress = 0;
		this.duration = 1;
		this.floored = false;

		this.keys = [];

		this.hpd = this.hp = this.mhp = 200;
		this.damage = 0;
		this.damageReach = 0;
	}
	draw(){
		this.process();
		this.x += this.vx;
		this.y += this.vy;
		if(this.x > Fighter.Right){
			this.x = Fighter.Right;
			this.vx = 0;
		}
		if(this.x < Fighter.Left){
			this.x = Fighter.Left;
			this.vx = 0;
		}
		if(this.y > Fighter.Bottom){
			this.y = Fighter.Bottom;
			this.vy = 0;
		}else this.vy += Fighter.GRAVITY;
		this.vx = this.vx - Math.min(Fighter.DRAG, Math.max(-Fighter.DRAG, this.vx));
		this.floored = this.y >= Fighter.Bottom;


		push();
		fill(0);
		// if(this.yo) console.log(this.yo)
		translate(this.x, this.y + this.yo);

		let animation = this.state;
		let next = this.nextState || animations[animation].next;
		let animationProgress = this.progress + animations[animation].start;
		text(animation + "->" + next, 0, -150);
		text(animationProgress-animations[animation].start, 0, -125);
		// animationProgress ++;


		this.hpd += (this.hp - this.hpd) / 30;
		noStroke();
		fill(100,50,0); rect(-50, 100, Math.max(0, this.hpd)/this.mhp*100, 20);
		fill(200,100,0); rect(-50, 100, Math.max(0, this.hp)/this.mhp*100, 20);


		scale(this.flip ? -1 : 1, 1);
		if(animationProgress in frames[this.actor]) image(frames[this.actor][Math.floor(animationProgress/K)*K] || frames[this.actor][0], 0, 0);
		pop();
	}
	process(){
		if(this.type === "player" || this.type === "bot") this.handleInputs();
		for(let f of fighters){
			if(f === this || !f.damage || this.hp <= 0 || f.state === "startup") continue;
			if(Math.abs(f.x-this.x) < Fighter.HB_WIDTH+f.damageReach && Math.abs(f.y-this.y) < Fighter.HB_HEIGHT){
				if(f.damage){
					if(!this.floored) this.vy = -0.7*Fighter.JUMP;
					if(this.state.startsWith("crouch")) f.damage /= 5; // guard
					if(this.state.startsWith("block")){
						// console.log(this.state, this.progress);
						if(this.state === "block_start" && this.progress >= 30){
							this.setDamage(Math.max(15, Math.floor(f.damage*1.2)), 1000);
							this.updateState("block_end");
							console.log("block", this.damage);
							f.process();
						}else this.updateState("stagger_1");
						f.damage = 0;
					}

					this.hp -= f.damage; // take damage
					if(f.damage < 5) {}
					else if(f.damage < 15){
						this.updateState("stagger_1"); // staggers
						this.vy = -0.2*Fighter.JUMP;
					} else if(f.damage < 30){
						this.updateState("stagger_2");
						this.vy = -0.4*Fighter.JUMP
					} else {
						this.updateState("knockback");
						this.vy = -0.6*Fighter.JUMP
					}
					if(f.damage && (this.state.startsWith("stagger") || this.state === "knockback")){
						this.vx = ((f.x > this.x) ? -1 : 1) * ({
							"stagger_1": 3,
							"stagger_2": 5,
							"knockback": 7
						}[this.state]);
						this.flip = this.vx > 0;
					}
					if(this.hp <= 0){
						this.updateState("die_start"); // kys
						f.score += 1;
						scoreupdate = frameCount;
					}
					f.setDamage(0); // accept damage (only one instance)
				}
			}
		}

		this.damage = 0;
		this.yo = 0;
		switch(this.state){
			case "startup": if(!this.floored) this.progress = 0; break;
			case "idle": break;
			case "walk_forward":  if(this.keys["RIGHT"]) this.vx = Math.min( 5, this.vx+(0.6+Fighter.DRAG)); this.flip=this.nflip = false; break;
			case "walk_backward": if(this.keys["LEFT"]) this.vx = Math.max(-5, this.vx-(0.6+Fighter.DRAG)); this.flip=this.nflip = true;  break;
			case "jump": if(!this.progress) this.vy = -Fighter.JUMP;  this.flip = this.nflip; break;
			case "punch_light":   if(!this.progress) this.setDamage( 5, -10);  break;
			case "punch_heavier": if(!this.progress) this.setDamage(10);  break;
			case "kick": 		  if(this.progress === 35) this.setDamage(50, 35);  break;
			case "combo_one":     if(!this.progress) this.setDamage(12);  
							      if(this.progress === 50) this.setDamage(20, 40);  break;
			case "kick_spin":     if(this.progress === 20 || this.progress === 40) this.setDamage(29, 20);  break;
			// case "crouch_kick":
			case "crouch_start":
			case "block_start":
			case "knockback": 	  this.yo = 45*(this.progress/this.duration)**0.5; break;
			case "die_start": 	  this.yo = 80*(this.progress/this.duration)**0.5; break;
			case "crouch_end__kick_included": if(this.progress===30) this.setDamage(50, 50);
			case "block_end":
			case "crouch_end":    this.yo = 45*(1-this.progress/this.duration)**3; break;
			case "block_hold__alternatively_freeze":
			case "crouch_idle":   this.yo = 45; break;
			case "die_loop":      this.yo = 80; 
				if(true||this.type==="bot") this.setup();
				break;
			// case "crouch"
		}
		this.progress ++;
		const currentAnimation = animations[this.state];
		if(this.progress >= currentAnimation.end-currentAnimation.start){
			this.updateState(this.nextState || currentAnimation.next)
		}
	}
	handleInputs(){
		if(this.type === "bot"){
			const p = fighters[0];
			const d = Math.abs(this.x-p.x);
			this.keys = [];
			if(d < Fighter.HB_WIDTH-10) this.keys["LIGHT"] = true;
			else if(d < Fighter.HB_WIDTH+20) this.keys["SPECIAL"] = true;
			else if(this.x > p.x) this.keys["LEFT"] = true;
			else if(this.x < p.x) this.keys["RIGHT"] = true;
			if(p.y < this.y - 10) this.keys["UP"] = true;
			// console.log(this.keys);
		}
		
		let attacksAllowed = false;
		switch(this.state){
			case "idle":
				let floorcheck = this.floored;
				if(this.keys["LEFT"] && floorcheck) this.updateState("walk_backward", true);
				if(this.keys["RIGHT"] && floorcheck) this.updateState("walk_forward", true);
				if(this.keys["UP"] && floorcheck) this.updateState("jump");
				attacksAllowed = true;
				break;
			case "walk_backward":
				if(!this.progress && !this.keys["LEFT"]) this.updateState("idle");
				if(this.keys["UP"]) this.updateState("jump");
				attacksAllowed = true;
				break;
			case "walk_forward":
				if(!this.progress && !this.keys["RIGHT"]) this.updateState("idle");
				if(this.keys["UP"]) this.updateState("jump");
				attacksAllowed = true;
				break;
			case "crouch_start": if(this.keys["SPECIAL"]) this.updateState("block_start"); break;
			case "crouch_idle":
				if(!this.progress && this.keys["LIGHT"]) this.updateState("crouch_end__kick_included");
				if(this.keys["SPECIAL"]) this.updateState("block_hold__alternatively_freeze");
			case "block_hold__alternatively_freeze":
				if(!this.progress && !this.keys["DOWN"]) this.updateState("crouch_end");
				if(this.keys["UP"]) this.updateState("jump");
				break;
			case "jump": if(this.keys["LIGHT"]) this.updateState("kick"); break;
			case "punch_light":  if(this.keys["LIGHT"] && this.progress > 10) this.updateState("punch_heavier"); break;
			case "punch_heavier":if(this.keys["LIGHT"] && this.progress > 30) this.updateState("combo_one"); break;
		}
		if(attacksAllowed){
			if(this.keys["DOWN"]) this.updateState("crouch_start");
			if(this.keys["LIGHT"]) this.updateState("punch_light");
			if(this.keys["SPECIAL"]) this.updateState("kick_spin");
		}
	}
	setDamage(x, dr=0){
		this.damage = x;
		this.damageReach = dr;
		this.flip = this.nflip;
	}
	updateState(state, loop){
		this.state = state;
		this.nextState = (loop===true ? this.state : loop) || null;
		this.progress = 0;
		this.duration = animations[state].end - animations[state].start;
	}
}

function restart(){
	fighters = [...new Array(2)].map((_,i,a) => new Fighter(i?"player":"player", i?"saachin":"nate", 200+(500/(a.length-1))*i))
}
restart();
function draw(){
	background(200);
	push();
	if(frameCount-120 < scoreupdate){
		let t = Math.min(1, (frameCount-scoreupdate)/30); 
		push();
		translate(width/2, height/2);
		scale(44 * (1-t)**0.5 + 20);
		fill(0, t*255 - 2*(frameCount-scoreupdate));
		let [x, y] = [fighters[0].score, fighters[1].score];
		text(((x+y) ? `${x} - ${y}` : "START"), 0, 0);
		pop();
		let nt = (t < 1 ? 1 : Math.max(0, (frameCount-scoreupdate+15)/120));
		translate((Math.random()-0.5)*(1-nt)*20, (Math.random()-0.5)*(1-nt)*20);
	}

	for(const f of fighters) f.draw();
	pop();
}