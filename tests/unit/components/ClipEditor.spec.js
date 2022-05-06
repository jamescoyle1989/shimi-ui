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
    })
});