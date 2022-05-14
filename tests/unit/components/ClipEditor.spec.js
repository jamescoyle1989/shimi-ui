import { shallowMount } from '@vue/test-utils';
import ClipEditor from '@/components/ClipEditor.vue';
import { Clip, ClipNote, ScaleTemplate } from 'shimi';

describe('ClipEditor', () => {
    let cmp;
    beforeEach(() => cmp = shallowMount(ClipEditor));

    describe('pitches', () => {
        it('contains correct values', () => {
            const pitches = cmp.vm.pitches;
            expect(pitches.length).toEqual(128);
            expect(pitches[0]).toEqual(127);
            expect(pitches[127]).toEqual(0);
        }),
        it('returns filtered results if scale set', async () => {
            const scale = ScaleTemplate.major.create(0);
            await cmp.setProps({ scale: scale });
            const pitches = cmp.vm.pitches;
            expect(pitches.length).toEqual(75);
            expect(pitches[1]).toEqual(125);
            expect(pitches[73]).toEqual(2);
        }),
        it('only generates pitches within minPitch & maxPitch range', async () => {
            await cmp.setProps({ minPitch: 20, maxPitch: 24 });
            const pitches = cmp.vm.pitches;
            expect(pitches.length).toEqual(5);
            expect(pitches[0]).toEqual(24);
            expect(pitches[4]).toEqual(20);
        })
    }),

    describe('pitchIsBlack', () => {
        it('returns correct output', () => {
            expect(cmp.vm.pitchIsBlack(12)).toBeFalsy();
            expect(cmp.vm.pitchIsBlack(13)).toBeTruthy();
        })
    }),

    describe('clipDuration', () => {
        it('returns 0 if no clip', () => {
            expect(cmp.vm.clipDuration).toEqual(0);
        }),
        it('returns clip duration if set', async () => {
            await cmp.setProps({ clip: new Clip(13) });
            expect(cmp.vm.clipDuration).toEqual(13);
        })
    }),

    describe('clipNotes', () => {
        it('returns empty array if no clip', () => {
            expect(cmp.vm.clipNotes.length).toEqual(0);
        }),
        it('returns clip notes if clip set', async () => {
            const clip = new Clip(4);
            clip.notes.push(new ClipNote(0, 1, 60, 80));
            clip.notes.push(new ClipNote(1, 1, 62, 80));
            clip.notes.push(new ClipNote(2, 1, 64, 80));
            await cmp.setProps({ clip });
            expect(cmp.vm.clipNotes.length).toEqual(3);
        })
    }),

    describe('getNoteColor', () => {
        it('returns ugly green color', () => {
            expect(cmp.vm.getNoteColor(new ClipNote(0, 1, 60, 80))).toEqual('#00FF00');
        })
    }),

    describe('beatLines', () => {
        it('returns single line if no clip defined', () => {
            const beatLines = cmp.vm.beatLines;
            expect(beatLines.length).toEqual(1);
            expect(beatLines[0].beat).toEqual(0);
            expect(beatLines[0].class).toEqual('sh-clip-bar-line');
        }),
        it('returns correct lines if clip set', async () => {
            const clip = new Clip(6);
            await cmp.setProps({ clip, beatsPerBar: 3, divisionsPerBeat: 5 });
            const beatLines = cmp.vm.beatLines;
            expect(beatLines.length).toEqual(31);
            expect(beatLines[0].class).toEqual('sh-clip-bar-line');
            expect(beatLines[1].class).toEqual('sh-clip-division-line');
            expect(beatLines[5].class).toEqual('sh-clip-beat-line');
            expect(beatLines[15].class).toEqual('sh-clip-bar-line');
        })
    }),

    describe('octaveLabelPitch', () => {
        it('returns 0 if scale not set', () => {
            expect(cmp.vm.octaveLabelPitch).toEqual(0);
        }),
        it('returns 1 when filtering by D major scale', async () => {
            await cmp.setProps({ scale: ScaleTemplate.major.create(2) });
            expect(cmp.vm.octaveLabelPitch).toEqual(1);
        })
    }),

    describe('safeMinPitch', () => {
        it('is always within MIDI pitch range', async () => {
            await cmp.setProps({ minPitch: -10 });
            expect(cmp.vm.safeMinPitch).toEqual(0);
        }),
        it('equals valid minPitch values', async () => {
            await cmp.setProps({ minPitch: 15 });
            expect(cmp.vm.safeMinPitch).toEqual(15);
        }),
        it('handles minPitch as text', async () => {
            await cmp.setProps({ minPitch: '24' });
            expect(cmp.vm.safeMinPitch).toEqual(24);
        })
    }),

    describe('safeMaxPitch', () => {
        it('is always within MIDI pitch range', async () => {
            await cmp.setProps({ maxPitch: -10 });
            expect(cmp.vm.safeMaxPitch).toEqual(0);
        }),
        it('equals valid maxPitch values', async () => {
            await cmp.setProps({ maxPitch: 15 });
            expect(cmp.vm.safeMaxPitch).toEqual(15);
        }),
        it('is never less than safeMinPitch', async () => {
            await cmp.setProps({ minPitch: 25, maxPitch: 20 });
            expect(cmp.vm.safeMaxPitch).toEqual(25);
        })
    }),

    describe('pitchAboveIsSameColor', () => {
        it('returns false when white pitch and black pitch is above', () => {
            expect(cmp.vm.pitchAboveIsSameColor(24)).toBeFalsy();
        }),
        it('returns true when white pitch and black pitch is above', () => {
            expect(cmp.vm.pitchAboveIsSameColor(23)).toBeTruthy();
        }),
        it('returns false when black pitch and white pitch is above', () => {
            expect(cmp.vm.pitchAboveIsSameColor(25)).toBeFalsy();
        }),
        it('returns true when black pitch and black pitch is above', async () => {
            await cmp.setProps({ scale: ScaleTemplate.major.create(1) });
            expect(cmp.vm.pitchAboveIsSameColor(25)).toBeTruthy();
        })
    })
});