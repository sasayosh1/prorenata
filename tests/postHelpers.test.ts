const { removeGreetings, sanitizeSummaryText } = require('../tools/lib/maintenance/postHelpers');

describe('postHelpers', () => {
    describe('removeGreetings', () => {
        it('should remove common greetings', () => {
            const blocks = [{
                _type: 'block',
                children: [{ _type: 'span', text: 'こんにちは、白崎セラです。' }]
            }];
            const result = removeGreetings(blocks);
            expect(result.length).toBe(0);
        });

        it('should keep content after greetings', () => {
            const blocks = [{
                _type: 'block',
                children: [{ _type: 'span', text: 'こんにちは！今日は看護助手の仕事についてお話しします。' }]
            }];
            const result = removeGreetings(blocks);
            expect(result[0].children[0].text).toBe('今日は看護助手の仕事についてお話しします。');
        });
    });

    describe('sanitizeSummaryText', () => {
        it('should remove persona noise from【】labels', () => {
            const text = '【白崎セラ解説】看護助手の仕事内容';
            expect(sanitizeSummaryText(text)).toBe('看護助手の仕事内容');
        });

        it('should keep valid【】labels', () => {
            const text = '【2026年改定】診療報酬について';
            expect(sanitizeSummaryText(text)).toBe('【2026年改定】診療報酬について');
        });
    });
});
