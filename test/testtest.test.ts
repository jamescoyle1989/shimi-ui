import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Note } from 'shimi';

@suite class TestTests {
    @test 'Can test note'() {
        const note = new Note(60, 80, 1, 'test');
        expect(note.on).to.be.true;
        expect(note.onTracker.isDirty).to.be.true;
        note.on = false;
        expect(note.onTracker.isDirty).to.be.false;
    }
}