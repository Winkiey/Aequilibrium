import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import EconomicsBook from '../.sites-runtime/test-modules/EconomicsBook.mjs';
import {READING_CHAPTERS,READING_SOURCES} from '../.sites-runtime/test-modules/reading.mjs';
import {READING_ORDER,READING_VOLUMES,READING_STUDY,readingMatches} from '../.sites-runtime/test-modules/reading-study.mjs';
import {READING_SOURCE_NOTES} from '../.sites-runtime/test-modules/reading-sources.mjs';

test('all six volumes form one complete reading route without changing legacy bookmark indexes',()=>{
 assert.deepEqual(READING_CHAPTERS.slice(0,12).map(c=>c.id),['choice','time','liquidity','business','risk','mental','reference','information','credit','incentives','commons','life']);
 const ids=READING_CHAPTERS.map(c=>c.id).sort();assert.equal(READING_VOLUMES.length,6);
 assert.equal(new Set(READING_ORDER).size,18);assert.deepEqual([...READING_ORDER].sort(),ids);
 assert.deepEqual(Object.keys(READING_STUDY).sort(),ids);
 for(const c of READING_CHAPTERS){const s=READING_STUDY[c.id];assert.equal(s.headings.length,c.summary.length);assert.equal(s.concepts.length,2);assert.equal(s.chain.length,3);assert.ok(s.exercise.answer.length>35);assert.ok(s.related.every(id=>ids.includes(id)&&id!==c.id));}
});
test('every reading source has a substantive, clearly bounded in-app editorial note',()=>{
 assert.deepEqual(Object.keys(READING_SOURCE_NOTES).sort(),Object.keys(READING_SOURCES).sort());
 for(const note of Object.values(READING_SOURCE_NOTES)){assert.ok(note.question.length>10);assert.ok(note.argument.length>50);assert.ok(note.boundary.length>25);}
});
test('concept search supports whitespace, substrings and an empty result',()=>{
 const find=q=>READING_CHAPTERS.filter(c=>readingMatches(c.id,q,c.title,c.terms)).map(c=>c.id);
 assert.equal(find('  ').length,18);assert.ok(find('现金流').includes('business'));
 assert.ok(find('损失厌恶').includes('reference'));assert.ok(find('相关性').includes('portfolio'));
 assert.deepEqual(find('这是一段不存在的检索文字'),[]);
});
test('all actual book spreads render their correct legacy chapter and unique accessible controls',()=>{
 for(let page=0;page<READING_CHAPTERS.length;page++){
  const c=READING_CHAPTERS[page],html=renderToStaticMarkup(createElement(EconomicsBook,{page,onPage:()=>{},reducedMotion:true}));
  assert.ok(html.includes(`data-book-chapter="${c.id}"`));assert.ok(html.includes(c.title));assert.ok(html.includes('六卷目录'));assert.ok(html.includes('书签留在本章'));
  const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  assert.doesNotMatch(html,/<a\s/);assert.ok(html.includes('role="tablist"'));
 }
 const invalid=renderToStaticMarkup(createElement(EconomicsBook,{page:Number.NaN,onPage:()=>{},reducedMotion:true}));assert.ok(invalid.includes('data-book-chapter="choice"'));
});
