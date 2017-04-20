import { TextCutter } from './../../utils/text-cuter';
import * as assert from 'assert';

describe('TextCutter', function () {
    it('should cut' , function () {
        let textCutter = new TextCutter('line1\nline2\nline3');;
        textCutter.goto(6).cut(5);
        assert.equal(textCutter.result, 'line1\n\nline3');
    });

    it('should cut & cut empty line' , function () {
        let textCutter = new TextCutter('line1\nline2\nline3');;
        textCutter.goto(6).cut(5).cutEmptyLine();
        assert.equal(textCutter.result, 'line1\nline3');
    });

    it('should cut line' , function () {
        let textCutter = new TextCutter('line1\nline2\nline3');;
        textCutter.goto(6).cut(5).cutLine();
        assert.equal(textCutter.result, 'line1\nline3');
    });

    it('should cut line if' , function () {
        let textCutter = new TextCutter('line1\nline2\nline3');
        textCutter.goto(6).cutLineIf(l => l === 'line2');
        assert.equal(textCutter.result, 'line1\nline3');
    });

    it('should cut real case' , function () {
        let original = `<?xml version="1.0" encoding="utf-8"?>
<packages>
  <!--dfgsdf -->
  <package id="Microsoft.Azure.Mobile" version="0.8.1" targetFramework="monoandroid403" />
  <package id="Microsoft.Azure.Mobile.Analytics" version="0.8.1" targetFramework="monoandroid403" />
  <package id="Microsoft.Azure.Mobile.Crashes" version="0.8.1" targetFramework="monoandroid403" />
  <package id="Microsoft.Azure.Mobile.Distribute" version="0.8.1" targetFramework="monoandroid403" />
  <!--dfgsdf -->
</packages>`;
        let expected = `<?xml version="1.0" encoding="utf-8"?>
<packages>
  <!--dfgsdf -->
  <!--dfgsdf -->
</packages>`;
        let textCutter = new TextCutter(original);
        textCutter
            .goto(original.indexOf('<package id="Microsoft.Azure.Mobile" version="0.8.1" targetFramework="monoandroid403" />'))
            .cut('<package id="Microsoft.Azure.Mobile" version="0.8.1" targetFramework="monoandroid403" />'.length)
            .cutEmptyLine();
        textCutter
            .goto(original.indexOf('<package id="Microsoft.Azure.Mobile.Analytics" version="0.8.1" targetFramework="monoandroid403" />'))
            .cut('<package id="Microsoft.Azure.Mobile.Analytics" version="0.8.1" targetFramework="monoandroid403" />'.length)
            .cutEmptyLine();
        textCutter
            .goto(original.indexOf('<package id="Microsoft.Azure.Mobile.Crashes" version="0.8.1" targetFramework="monoandroid403" />'))
            .cut('<package id="Microsoft.Azure.Mobile.Crashes" version="0.8.1" targetFramework="monoandroid403" />'.length)
            .cutEmptyLine();
        textCutter
            .goto(original.indexOf('<package id="Microsoft.Azure.Mobile.Distribute" version="0.8.1" targetFramework="monoandroid403" />'))
            .cut('<package id="Microsoft.Azure.Mobile.Distribute" version="0.8.1" targetFramework="monoandroid403" />'.length)
            .cutEmptyLine();
        assert.equal(textCutter.result, expected);
    });
    
});