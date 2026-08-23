import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';

import strokeData from '../../assets/data/kanji/strokes.json';
import { Point } from '../stroke/geometry';
import { flattenPath } from '../stroke/svg-path';
import { Attempt } from '../srs/srs';
import { WritingExerciseComponent } from './writing-exercise.component';

/** 上: three strokes, the fewest the deck asks for in a character that divides. */
const STROKES = strokeData.characters.find(character => character.kanji === '上')!.strokes;

/** The pad hands finished strokes over as points; this is that call. */
interface Judging {
  judge(points: Point[]): void;
}

describe('a deferred writing', () => {
  let fixture: ComponentFixture<WritingExerciseComponent>;
  let component: WritingExerciseComponent;
  let finished: Attempt[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritingExerciseComponent],
      providers: [provideIonicAngular(), provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(WritingExerciseComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('strokes', STROKES);
    fixture.componentRef.setInput('deferred', true);
    fixture.componentRef.setInput('hints', false);
    fixture.detectChanges();

    finished = [];
    component.finished.subscribe(attempt => finished.push(attempt));
  });

  const write = (stroke: string) =>
    (component as unknown as Judging).judge(flattenPath(stroke));

  /** The three strokes of 上, drawn as they are drawn. */
  const writeAll = () => STROKES.forEach(write);

  it('counts nothing against a character traced exactly', () => {
    writeAll();

    expect(finished).toEqual([{ mistakes: 0, hintsUsed: false }]);
  });

  /**
   * The bug this file was written for. Where the writing is judged at the end,
   * the gum is there to put it right before anyone looks: a learner who sees
   * their own stroke go wrong, rubs it out and writes it again has written the
   * character correctly, and used to be marked down for the stroke that is no
   * longer on the paper.
   */
  it('forgets a stroke that was rubbed out again', () => {
    write(STROKES[0]);
    write(STROKES[0]); // Where the second stroke was due: wrong, and it lands.
    component.undo();

    write(STROKES[1]);
    write(STROKES[2]);

    expect(finished).toEqual([{ mistakes: 0, hintsUsed: false }]);
  });

  it('still counts a wrong stroke that was left standing', () => {
    write(STROKES[0]);
    write(STROKES[0]);
    write(STROKES[2]);

    expect(finished).toEqual([{ mistakes: 1, hintsUsed: false }]);
  });

  /**
   * The count forgets an erased stroke; the praise does not. "Every stroke
   * first time" is a claim about how it went, and a stroke written twice was
   * not written once - so the review passes clean and says only that it is
   * done.
   */
  it('does not claim every stroke went first time when one was rewritten', () => {
    write(STROKES[0]);
    write(STROKES[0]);
    component.undo();
    write(STROKES[1]);
    write(STROKES[2]);

    expect(finished).toEqual([{ mistakes: 0, hintsUsed: false }]);
    expect((component as unknown as { flawless(): boolean }).flawless()).toBe(false);
  });

  /** Starting over is the same promise as the gum, for the whole character. */
  it('forgets everything a restart takes off the paper', () => {
    write(STROKES[0]);
    write(STROKES[0]);
    component.restart();

    writeAll();

    expect(finished).toEqual([{ mistakes: 0, hintsUsed: false }]);
  });
});
