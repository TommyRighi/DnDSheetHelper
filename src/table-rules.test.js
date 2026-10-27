import { test } from 'node:test';
import assert from 'node:assert/strict';
import { characterValues, applyRest, normalizeRules } from './table-rules.js';
import { parseCharacterSave } from './storage.js';
const hero = () => ({ name:'Lyra', surname:'',race:'Elfo dei boschi',className:'Ranger',level:4,hp:20,maxHp:36,slots:1,hitDice:4,xp:0,gold:0,notes:'',stats:[12,18,14,10,16,8],inventory:[],logs:[], tableRules: { overrides:{}, effects:[],resources:[],history:[] } });
const effect = (id,target,amount,duration='manual') => ({ id,name:id,target,amount,duration });
test('manual values replace calculations and named effects add on top', () => {
  const c=hero();c.tableRules.overrides={ ac:{value:19,reason:'Armatura del master'},proficiency:{value:5,reason:''},maxSlots:{value:8,reason:'Regola di campagna'} };c.tableRules.effects=[effect('Benedizione','ac',2),effect('Mira','attack',3)];
  const v=characterValues(c);assert.equal(v.ac,21);assert.equal(v.attack,12);assert.equal(v.maxSlots,8);assert.equal(v.details.ac.base,16);assert.equal(v.details.ac.effects[0].name,'Benedizione');
});
test('import and export preserve excess resources, custom effects and reasons', () => {
  const c=hero();Object.assign(c,{hp:60,slots:12,hitDice:10});c.stats[0]=40;c.tableRules.overrides.ac={value:21,reason:'Dono del master'};c.tableRules.effects=[effect('Velo','ac',2,'longRest')];
  const parsed=parseCharacterSave(JSON.stringify(c));assert.equal(parsed.hp,60);assert.equal(parsed.slots,12);assert.equal(parsed.hitDice,10);assert.equal(parsed.stats[0],40);assert.deepEqual(parsed.tableRules,c.tableRules);
});
test('short rest expires matching effects, recovers matching resources and spends chosen dice', () => {
  const c=hero();c.tableRules.effects=[effect('Breve','ac',2,'shortRest'),effect('Lungo','ac',3,'longRest'),effect('Permanente','ac',1)];c.tableRules.resources=[{id:'r',name:'Reliquia',current:0,max:3,recovery:'shortRest'}];
  const n=applyRest(c,{long:false,rolls:[4,5]});assert.equal(n.hp,33);assert.equal(n.hitDice,2);assert.equal(n.slots,1);assert.deepEqual(n.tableRules.effects.map(e=>e.id),['Lungo','Permanente']);assert.equal(n.tableRules.resources[0].current,3);assert.match(n.tableRules.history[0].text,/Breve/);assert.equal(c.tableRules.effects.length,3);
});
test('rest previews and recovery use limits after expiring effects; excess is never reduced', () => {
  const c=hero();c.tableRules.effects=[effect('Vigore','maxHp',20,'longRest'),effect('Dono','maxSlots',4,'longRest')];
  const n=applyRest(c,{long:true});assert.equal(n.hp,36);assert.equal(n.slots,3);assert.equal(n.tableRules.effects.length,0);
  Object.assign(c,{hp:70,slots:20,hitDice:12});const excess=applyRest(c,{long:true});assert.equal(excess.hp,70);assert.equal(excess.slots,20);assert.equal(excess.hitDice,12);
  const short=applyRest(c,{long:false,rolls:[10]});assert.equal(short.hp,70);assert.equal(short.hitDice,11);
});
test('rest can keep effects and skip individual recoveries, including at full HP or zero dice', () => {
  const c=hero();c.tableRules.effects=[effect('Vigore','maxHp',20,'shortRest')];c.tableRules.resources=[{id:'x',name:'Cariche',current:0,max:5,recovery:'longRest'}];
  const n=applyRest(c,{long:true,expire:false,hp:false,slots:false,hitDice:false,resources:false});assert.equal(n.hp,20);assert.equal(n.slots,1);assert.equal(n.tableRules.effects.length,1);assert.equal(n.tableRules.resources[0].current,0);
  const full={...hero(),hp:36,hitDice:0};assert.equal(applyRest(full,{long:false}).hp,36);assert.throws(()=>applyRest(full,{long:false,rolls:[1]}));
});
test('malformed customization is discarded and safe older saves get empty rules', () => {
  const r=normalizeRules({overrides:{ac:{value:NaN},maxSlots:{value:-1},constructor:{value:20}},effects:[{id:'x',name:'Bad',target:'constructor',amount:2,duration:'manual'}],resources:[{id:'x',name:'Bad',max:2,current:-1,recovery:'manual'}],history:[{at:'bad',text:'x'}]});assert.deepEqual(r,{overrides:{},effects:[],resources:[],history:[]});
  const c=hero();delete c.tableRules;assert.deepEqual(parseCharacterSave(JSON.stringify(c)).tableRules,normalizeRules());
});

import { createCharacter, derive, restWithExceptions, adjustHP } from './rules/engine.js';
test('edition engine, slot pools and saves follow table overrides without applying bonuses twice', () => {
 const c=createCharacter({name:'Mago',editionId:'5.5-2024',classId:'wizard'});c.tableRules={overrides:{proficiency:{value:5,reason:'Master'},maxSlots:{value:7,reason:''},ac:{value:19,reason:''}},effects:[effect('Benedizione','ac',2)],resources:[],history:[]};
 const base=derive({...c,tableRules:{}}),d=derive(c);assert.equal(d.ac,21);assert.equal(d.proficiency,5);assert.equal(d.slotPools[0].max,7);assert.equal(d.spellDC,base.spellDC+3);assert.equal(d.ranged,base.ranged+3);assert.equal(d.saves[3].value,base.saves[3].value+3);
 assert.equal(parseCharacterSave(JSON.stringify(c)).tableRules.overrides.ac.value,19);
});
test('edition rest preserves excess slots and selectable expiry and allows explicit manual recovery', () => {
 const c=createCharacter({name:'Mago',editionId:'5.5-2024',classId:'wizard'});c.tableRules={overrides:{maxSlots:{value:7,reason:''}},effects:[effect('Vigore','maxHp',20,'longRest')],resources:[],history:[]};c.rules.slotUsed[1]=-3;c.hp=60;c.hitDice=8;
 let n=restWithExceptions(c,'long',{options:{expire:false}});assert.equal(n.hp,60);assert.equal(n.hitDice,8);assert.equal(derive(n).slotPools[0].max-n.rules.slotUsed[1],10);assert.equal(n.tableRules.effects.length,1);
 n=restWithExceptions(c,'long');assert.equal(n.tableRules.effects.length,0);assert.equal(n.hp,60);assert.equal(parseCharacterSave(JSON.stringify(n)).rules.slotUsed[1],-3);
 c.hp=0;assert.throws(()=>restWithExceptions(c,'long'));n=restWithExceptions(c,'long',{manual:true});assert.ok(n.hp>0);assert.match(n.tableRules.history[0].text,/manuale/);
 c.hp=60;assert.equal(adjustHP(c,5).hp,60);assert.equal(adjustHP(c,-2).hp,58);
});
