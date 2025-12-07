import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'speechBubble',
    title: 'Speech Bubble',
    type: 'object',
    fields: [
        defineField({
            name: 'speaker',
            title: 'Speaker',
            type: 'string',
            options: {
                list: [
                    { title: '白崎セラ', value: 'sera' },
                    { title: '患者さん', value: 'patient' },
                    { title: '先輩ナース', value: 'nurse' },
                ],
                layout: 'radio',
                direction: 'horizontal'
            },
            initialValue: 'sera',
            validation: rule => rule.required()
        }),
        defineField({
            name: 'emotion',
            title: 'Emotion',
            type: 'string',
            options: {
                list: [
                    { title: '通常', value: 'normal' },
                    { title: '笑顔', value: 'happy' },
                    { title: '困り/悲しみ', value: 'sad' },
                    { title: '思考/悩み', value: 'thinking' },
                    { title: '怒り/真剣', value: 'angry' },
                ],
                layout: 'radio',
                direction: 'horizontal'
            },
            initialValue: 'normal',
            validation: rule => rule.required()
        }),
        defineField({
            name: 'position',
            title: 'Position',
            type: 'string',
            options: {
                list: [
                    { title: '左 (Left)', value: 'left' },
                    { title: '右 (Right)', value: 'right' },
                ],
                layout: 'radio'
            },
            initialValue: 'left',
            validation: rule => rule.required()
        }),
        defineField({
            name: 'text',
            title: 'Text',
            type: 'text',
            rows: 3,
            validation: rule => rule.required()
        }),
    ],
    preview: {
        select: {
            title: 'text',
            subtitle: 'speaker',
            emotion: 'emotion'
        },
        prepare(selection: { title?: string; subtitle?: string; emotion?: string }) {
            const { title, subtitle, emotion } = selection
            const emojis: Record<'normal' | 'happy' | 'sad' | 'thinking' | 'angry', string> = {
                normal: '😐',
                happy: '😊',
                sad: '😢',
                thinking: '🤔',
                angry: '😠'
            }
            const safeEmotion = (emotion as keyof typeof emojis) || 'normal'
            return {
                title: title,
                subtitle: `${subtitle ?? ''} (${emotion ?? 'normal'})`,
                media: () => emojis[safeEmotion] || '💬'
            }
        }
    }
})
