import * as assert from 'assert';
import { removeComments } from "../../utils/remove-comments";

describe('removeComments', function () {
    it('should remove single line comments' , function () {
        let source = 
`line0 //line0 comment
//line1 comment
line2`;
        let target = `line0  line2`;
        let result = removeComments(source);
        assert.equal(result, target);
    });

    it('should remove multi line comments' , function () {
        let source = 
`line0 /*comment
line1 comment*/
line2/**/`;
        let target = `line0 line2 `;
        let result = removeComments(source);
        assert.equal(result, target);
    });
        
});