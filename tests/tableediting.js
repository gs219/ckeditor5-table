/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import { getData as getModelData, parse, setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getCode } from '@ckeditor/ckeditor5-utils/src/keyboard';

import TableEditing from '../src/tableediting';
import { formatTable, formattedModelTable, modelTable } from './_utils/utils';
import InsertRowCommand from '../src/commands/insertrowcommand';
import InsertTableCommand from '../src/commands/inserttablecommand';
import InsertColumnCommand from '../src/commands/insertcolumncommand';
import RemoveRowCommand from '../src/commands/removerowcommand';
import RemoveColumnCommand from '../src/commands/removecolumncommand';
import SplitCellCommand from '../src/commands/splitcellcommand';
import MergeCellCommand from '../src/commands/mergecellcommand';
import SetHeaderRowCommand from '../src/commands/setheaderrowcommand';
import SetHeaderColumnCommand from '../src/commands/setheadercolumncommand';
import UndoEditing from '@ckeditor/ckeditor5-undo/src/undoediting';

describe( 'TableEditing', () => {
	let editor, model;

	beforeEach( () => {
		return VirtualTestEditor
			.create( {
				plugins: [ TableEditing, Paragraph, UndoEditing ]
			} )
			.then( newEditor => {
				editor = newEditor;

				model = editor.model;
			} );
	} );

	afterEach( () => {
		editor.destroy();
	} );

	it( 'should set proper schema rules', () => {
	} );

	it( 'adds insertTable command', () => {
		expect( editor.commands.get( 'insertTable' ) ).to.be.instanceOf( InsertTableCommand );
	} );

	it( 'adds insertRowAbove command', () => {
		expect( editor.commands.get( 'insertTableRowAbove' ) ).to.be.instanceOf( InsertRowCommand );
	} );

	it( 'adds insertRowBelow command', () => {
		expect( editor.commands.get( 'insertTableRowBelow' ) ).to.be.instanceOf( InsertRowCommand );
	} );

	it( 'adds insertColumnBefore command', () => {
		expect( editor.commands.get( 'insertTableColumnBefore' ) ).to.be.instanceOf( InsertColumnCommand );
	} );

	it( 'adds insertColumnAfter command', () => {
		expect( editor.commands.get( 'insertTableColumnAfter' ) ).to.be.instanceOf( InsertColumnCommand );
	} );

	it( 'adds removeRow command', () => {
		expect( editor.commands.get( 'removeTableRow' ) ).to.be.instanceOf( RemoveRowCommand );
	} );

	it( 'adds removeColumn command', () => {
		expect( editor.commands.get( 'removeTableColumn' ) ).to.be.instanceOf( RemoveColumnCommand );
	} );

	it( 'adds splitCellVertically command', () => {
		expect( editor.commands.get( 'splitTableCellVertically' ) ).to.be.instanceOf( SplitCellCommand );
	} );

	it( 'adds splitCellHorizontally command', () => {
		expect( editor.commands.get( 'splitTableCellHorizontally' ) ).to.be.instanceOf( SplitCellCommand );
	} );

	it( 'adds mergeCellRight command', () => {
		expect( editor.commands.get( 'mergeTableCellRight' ) ).to.be.instanceOf( MergeCellCommand );
	} );

	it( 'adds mergeCellLeft command', () => {
		expect( editor.commands.get( 'mergeTableCellLeft' ) ).to.be.instanceOf( MergeCellCommand );
	} );

	it( 'adds mergeCellDown command', () => {
		expect( editor.commands.get( 'mergeTableCellDown' ) ).to.be.instanceOf( MergeCellCommand );
	} );

	it( 'adds mergeCellUp command', () => {
		expect( editor.commands.get( 'mergeTableCellUp' ) ).to.be.instanceOf( MergeCellCommand );
	} );

	it( 'adds setColumnHeader command', () => {
		expect( editor.commands.get( 'setTableColumnHeader' ) ).to.be.instanceOf( SetHeaderColumnCommand );
	} );

	it( 'adds setRowHeader command', () => {
		expect( editor.commands.get( 'setTableRowHeader' ) ).to.be.instanceOf( SetHeaderRowCommand );
	} );

	describe( 'conversion in data pipeline', () => {
		describe( 'model to view', () => {
			it( 'should create tbody section', () => {
				setModelData( model, '<table><tableRow><tableCell>foo[]</tableCell></tableRow></table>' );

				expect( editor.getData() ).to.equal(
					'<figure class="table">' +
					'<table>' +
					'<tbody>' +
					'<tr><td>foo</td></tr>' +
					'</tbody>' +
					'</table>' +
					'</figure>'
				);
			} );

			it( 'should create thead section', () => {
				setModelData( model, '<table headingRows="1"><tableRow><tableCell>foo[]</tableCell></tableRow></table>' );

				expect( editor.getData() ).to.equal(
					'<figure class="table">' +
					'<table>' +
					'<thead>' +
					'<tr><th>foo</th></tr>' +
					'</thead>' +
					'</table>' +
					'</figure>'
				);
			} );
		} );

		describe( 'view to model', () => {
			it( 'should convert table', () => {
				editor.setData( '<table><tbody><tr><td>foo</td></tr></tbody></table>' );

				expect( getModelData( model, { withoutSelection: true } ) )
					.to.equal( '<table><tableRow><tableCell>foo</tableCell></tableRow></table>' );
			} );
		} );
	} );

	describe( 'caret movement', () => {
		let domEvtDataStub;

		beforeEach( () => {
			domEvtDataStub = {
				keyCode: getCode( 'Tab' ),
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			};
		} );

		it( 'should do nothing if not tab pressed', () => {
			setModelData( model, modelTable( [
				[ '11', '12[]' ]
			] ) );

			domEvtDataStub.keyCode = getCode( 'a' );

			editor.editing.view.document.fire( 'keydown', domEvtDataStub );

			sinon.assert.notCalled( domEvtDataStub.preventDefault );
			sinon.assert.notCalled( domEvtDataStub.stopPropagation );
			expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
				[ '11', '12[]' ]
			] ) );
		} );

		it( 'should do nothing if Ctrl+Tab is pressed', () => {
			setModelData( model, modelTable( [
				[ '11', '12[]' ]
			] ) );

			domEvtDataStub.ctrlKey = true;

			editor.editing.view.document.fire( 'keydown', domEvtDataStub );

			sinon.assert.notCalled( domEvtDataStub.preventDefault );
			sinon.assert.notCalled( domEvtDataStub.stopPropagation );
			expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
				[ '11', '12[]' ]
			] ) );
		} );

		describe( 'on TAB', () => {
			it( 'should do nothing if selection is not in a table', () => {
				setModelData( model, '[]' + modelTable( [
					[ '11', '12' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				sinon.assert.notCalled( domEvtDataStub.preventDefault );
				sinon.assert.notCalled( domEvtDataStub.stopPropagation );
				expect( formatTable( getModelData( model ) ) ).to.equal( '[]' + formattedModelTable( [
					[ '11', '12' ]
				] ) );
			} );

			it( 'should move to next cell', () => {
				setModelData( model, modelTable( [
					[ '11[]', '12' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				sinon.assert.calledOnce( domEvtDataStub.preventDefault );
				sinon.assert.calledOnce( domEvtDataStub.stopPropagation );
				expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
					[ '11', '[12]' ]
				] ) );
			} );

			it( 'should create another row and move to first cell in new row', () => {
				setModelData( model, modelTable( [
					[ '11', '[12]' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
					[ '11', '12' ],
					[ '[]', '' ]
				] ) );
			} );

			it( 'should move to the first cell of next row if on end of a row', () => {
				setModelData( model, modelTable( [
					[ '11', '12[]' ],
					[ '21', '22' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
					[ '11', '12' ],
					[ '[21]', '22' ]
				] ) );
			} );

			describe( 'on table widget selected', () => {
				beforeEach( () => {
					editor.model.schema.register( 'block', {
						allowWhere: '$block',
						allowContentOf: '$block',
						isObject: true
					} );

					editor.conversion.elementToElement( { model: 'block', view: 'block' } );
				} );

				it( 'should move caret to the first table cell on TAB', () => {
					const spy = sinon.spy();

					editor.editing.view.document.on( 'keydown', spy );

					setModelData( model, '[' + modelTable( [
						[ '11', '12' ]
					] ) + ']' );

					editor.editing.view.document.fire( 'keydown', domEvtDataStub );

					sinon.assert.calledOnce( domEvtDataStub.preventDefault );
					sinon.assert.calledOnce( domEvtDataStub.stopPropagation );

					expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
						[ '[11]', '12' ]
					] ) );

					// Should cancel event - so no other tab handler is called.
					sinon.assert.notCalled( spy );
				} );

				it( 'shouldn\'t do anything on other blocks', () => {
					const spy = sinon.spy();

					editor.editing.view.document.on( 'keydown', spy );

					setModelData( model, '[<block>foo</block>]' );

					editor.editing.view.document.fire( 'keydown', domEvtDataStub );

					sinon.assert.notCalled( domEvtDataStub.preventDefault );
					sinon.assert.notCalled( domEvtDataStub.stopPropagation );

					expect( formatTable( getModelData( model ) ) ).to.equal( '[<block>foo</block>]' );

					// Should not cancel event.
					sinon.assert.calledOnce( spy );
				} );
			} );
		} );

		describe( 'on SHIFT+TAB', () => {
			beforeEach( () => {
				domEvtDataStub.shiftKey = true;
			} );

			it( 'should do nothing if selection is not in a table', () => {
				setModelData( model, '[]' + modelTable( [
					[ '11', '12' ]
				] ) );

				domEvtDataStub.keyCode = getCode( 'Tab' );
				domEvtDataStub.shiftKey = true;

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				sinon.assert.notCalled( domEvtDataStub.preventDefault );
				sinon.assert.notCalled( domEvtDataStub.stopPropagation );
				expect( formatTable( getModelData( model ) ) ).to.equal( '[]' + formattedModelTable( [
					[ '11', '12' ]
				] ) );
			} );

			it( 'should move to previous cell', () => {
				setModelData( model, modelTable( [
					[ '11', '12[]' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				sinon.assert.calledOnce( domEvtDataStub.preventDefault );
				sinon.assert.calledOnce( domEvtDataStub.stopPropagation );
				expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
					[ '[11]', '12' ]
				] ) );
			} );

			it( 'should not move if caret is in first table cell', () => {
				setModelData( model, '<paragraph>foo</paragraph>' + modelTable( [
					[ '[]11', '12' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				expect( formatTable( getModelData( model ) ) ).to.equal(
					'<paragraph>foo</paragraph>' + formattedModelTable( [ [ '[]11', '12' ] ] )
				);
			} );

			it( 'should move to the last cell of previous row if on beginning of a row', () => {
				setModelData( model, modelTable( [
					[ '11', '12' ],
					[ '[]21', '22' ]
				] ) );

				editor.editing.view.document.fire( 'keydown', domEvtDataStub );

				expect( formatTable( getModelData( model ) ) ).to.equal( formattedModelTable( [
					[ '11', '[12]' ],
					[ '21', '22' ]
				] ) );
			} );
		} );
	} );

	describe( 'post-fixer', () => {
		let root;

		beforeEach( () => {
			root = model.document.getRoot();
		} );

		it( 'should add missing columns to a tableRows that are shorter then longest table row', () => {
			const parsed = parse( modelTable( [
				[ '00' ],
				[ '10', '11', '12' ],
				[ '20', '21' ]
			] ), model.schema );

			model.change( writer => {
				writer.remove( Range.createIn( root ) );
				writer.insert( parsed, root );
			} );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ) ).to.equal( formattedModelTable( [
				[ '00', '', '' ],
				[ '10', '11', '12' ],
				[ '20', '21', '' ]
			] ) );
		} );

		it( 'should add missing columns to a tableRows that are shorter then longest table row (complex 1)', () => {
			const parsed = parse( modelTable( [
				[ '00', { rowspan: 2, contents: '10' } ],
				[ '10', { colspan: 2, contents: '12' } ],
				[ '20', '21' ]
			] ), model.schema );

			model.change( writer => {
				writer.remove( Range.createIn( root ) );
				writer.insert( parsed, root );
			} );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ) ).to.equal( formattedModelTable( [
				[ '00', { rowspan: 2, contents: '10' }, '', '' ],
				[ '10', { colspan: 2, contents: '12' } ],
				[ '20', '21', '', '' ]
			] ) );
		} );

		it( 'should add missing columns to a tableRows that are shorter then longest table row (complex 2)', () => {
			const parsed = parse( modelTable( [
				[ { colspan: 6, contents: '00' } ],
				[ { rowspan: 2, contents: '10' }, '11', { colspan: 3, contents: '12' } ],
				[ '21', '22' ]
			] ), model.schema );

			model.change( writer => {
				writer.remove( Range.createIn( root ) );
				writer.insert( parsed, root );
			} );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ) ).to.equal( formattedModelTable( [
				[ { colspan: 6, contents: '00' } ],
				[ { rowspan: 2, contents: '10' }, '11', { colspan: 3, contents: '12' }, '' ],
				[ '21', '22', '', '', '' ]
			] ) );
		} );

		it( 'should fix wrong rowspan attribute on table header', () => {
			const parsed = parse( modelTable( [
				[ { rowspan: 2, contents: '00' }, { rowspan: 3, contents: '01' }, '02' ],
				[ { rowspan: 8, contents: '12' } ],
				[ '20', '21', '22' ]
			], { headingRows: 2 } ), model.schema );

			model.change( writer => {
				writer.remove( Range.createIn( root ) );
				writer.insert( parsed, root );
			} );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ) ).to.equal( formattedModelTable( [
				[ { rowspan: 2, contents: '00' }, { rowspan: 2, contents: '01' }, '02' ],
				[ '12' ],
				[ '20', '21', '22' ]
			], { headingRows: 2 } ) );
		} );

		it( 'should fix wrong rowspan attribute on table body', () => {
			const parsed = parse( modelTable( [
				[ '00', '01', '02' ],
				[ { rowspan: 2, contents: '10' }, { rowspan: 3, contents: '11' }, '12' ],
				[ { rowspan: 8, contents: '22' } ]
			], { headingRows: 1 } ), model.schema );

			model.change( writer => {
				writer.remove( Range.createIn( root ) );
				writer.insert( parsed, root );
			} );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ) ).to.equal( formattedModelTable( [
				[ '00', '01', '02' ],
				[ { rowspan: 2, contents: '10' }, { rowspan: 2, contents: '11' }, '12' ],
				[ '22' ]
			], { headingRows: 1 } ) );
		} );

		it( 'collab remove column vs insert row', () => {
			_testExternal(
				modelTable( [
					[ '00[]', '01' ],
					[ '10', '11' ]
				] ),
				writer => _removeColumn( writer, 1, [ 0, 1 ] ),
				writer => _insertRow( writer, 1, [ 'a', 'b' ] ),
				formattedModelTable( [
					[ '00', '' ],
					[ 'a', 'b' ],
					[ '10', '' ]
				] ),
				formattedModelTable( [
					[ '00', '01', '' ],
					[ 'a', 'b', '' ],
					[ '10', '11', '' ]
				] ) );
		} );

		it( 'collab insert row vs remove column', () => {
			_testExternal(
				modelTable( [
					[ '00[]', '01' ],
					[ '10', '11' ]
				] ),
				writer => _insertRow( writer, 1, [ 'a', 'b' ] ),
				writer => _removeColumn( writer, 1, [ 0, 2 ] ),
				formattedModelTable( [
					[ '00', '' ],
					[ 'a', 'b' ],
					[ '10', '' ]
				] ),
				formattedModelTable( [
					[ '00', '' ],
					[ '10', '' ]
				] ) );
		} );

		it( 'collab insert row vs insert column', () => {
			_testExternal(
				modelTable( [
					[ '00[]', '01' ],
					[ '10', '11' ]
				] ),
				writer => _insertRow( writer, 1, [ 'a', 'b' ] ),
				writer => _insertColumn( writer, 1, [ 0, 2 ] ),
				formattedModelTable( [
					[ '00', '', '01' ],
					[ 'a', 'b', '' ],
					[ '10', '', '11' ]
				] ),
				formattedModelTable( [
					[ '00', '', '01' ],
					[ '10', '', '11' ]
				] ) );
		} );

		it( 'collab insert column vs insert row', () => {
			_testExternal(
				modelTable( [
					[ '00[]', '01' ],
					[ '10', '11' ]
				] ),
				writer => _insertColumn( writer, 1, [ 0, 1 ] ),
				writer => _insertRow( writer, 1, [ 'a', 'b' ] ),
				formattedModelTable( [
					[ '00', '', '01' ],
					[ 'a', 'b', '' ],
					[ '10', '', '11' ]
				] ),
				formattedModelTable( [
					[ '00', '01', '' ],
					[ 'a', 'b', '' ],
					[ '10', '11', '' ]
				] ) );
		} );

		it( 'collab insert column vs insert column - other row has spanned cell', () => {
			_testExternal(
				modelTable( [
					[ { colspan: 3, contents: '00' } ],
					[ '10', '11', '12' ]
				] ),
				writer => {
					_setAttribute( writer, 'colspan', 4, [ 0, 0, 0 ] );
					_insertColumn( writer, 2, [ 1 ] );
				},
				writer => {
					_setAttribute( writer, 'colspan', 4, [ 0, 0, 0 ] );
					_insertColumn( writer, 1, [ 1 ] );
				},
				formattedModelTable( [
					[ { colspan: 4, contents: '00' }, '' ],
					[ '10', '', '11', '', '12' ]
				] ),
				formattedModelTable( [
					[ { colspan: 3, contents: '00' }, '' ],
					[ '10', '', '11', '12' ]
				] ) );
		} );

		it( 'collab insert column vs insert column - other row has spanned cell (inverted)', () => {
			_testExternal(
				modelTable( [
					[ { colspan: 3, contents: '00' } ],
					[ '10', '11', '12' ]
				] ),
				writer => {
					_setAttribute( writer, 'colspan', 4, [ 0, 0, 0 ] );
					_insertColumn( writer, 1, [ 1 ] );
				},
				writer => {
					_setAttribute( writer, 'colspan', 4, [ 0, 0, 0 ] );
					_insertColumn( writer, 3, [ 1 ] );
				},
				formattedModelTable( [
					[ { colspan: 4, contents: '00' }, '' ],
					[ '10', '', '11', '', '12' ]
				] ),
				formattedModelTable( [
					[ { colspan: 3, contents: '00' }, '' ],
					[ '10', '11', '', '12' ]
				] ) );
		} );

		it( 'collab change table header rows vs remove row', () => {
			_testExternal(
				modelTable( [
					[ '11', { rowspan: 2, contents: '12' }, '13' ],
					[ '21', '23' ],
					[ '31', '32', '33' ]
				] ),
				writer => {
					_setAttribute( writer, 'headingRows', 1, [ 0 ] );
					_setAttribute( writer, 'rowspan', 1, [ 0, 0, 1 ] );
					_insertCell( writer, 1, 1 );
				},
				writer => {
					_removeRow( writer, 1 );
				},
				formattedModelTable( [
					[ '11', { rowspan: 1, contents: '12' }, '13' ],
					[ '31', '32', '33' ]
				], { headingRows: 1 } ),
				formattedModelTable( [
					[ '11', { rowspan: 2, contents: '12' }, '13', '' ],
					[ '31', '32', '33' ]
				] ) );
		} );

		it( 'collab remove row vs change table header rows', () => {
			_testExternal(
				modelTable( [
					[ '11', { rowspan: 2, contents: '12' }, '13' ],
					[ '21', '23' ],
					[ '31', '32', '33' ]
				] ),
				writer => {
					_removeRow( writer, 1 );
				},
				writer => {
					_setAttribute( writer, 'headingRows', 1, [ 0 ] );
					_setAttribute( writer, 'rowspan', 1, [ 0, 0, 1 ] );
				},
				formattedModelTable( [
					[ '11', { rowspan: 1, contents: '12' }, '13', '' ],
					[ '31', '32', '33', '' ]
				], { headingRows: 1 } ),
				formattedModelTable( [
					[ '11', { rowspan: 1, contents: '12' }, '13', '' ],
					[ '21', '23', '', '' ],
					[ '31', '32', '33', '' ]
				], { headingRows: 1 } ) );
		} );

		it( 'should not crash on table remove', () => {
			setModelData( model, modelTable( [
				[ '11', '12' ]
			] ) );

			expect( () => {
				model.change( writer => {
					writer.remove( Range.createIn( root ) );
				} );
			} ).to.not.throw();

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal( '<paragraph></paragraph>' );
		} );

		// Case: remove same column (undo does nothing on one client - NOOP in batch).
		// Case: remove same row (undo does nothing on one client - NOOP in batch).
		// Case: Typing over user selecting - typing in marker...

		function _testExternal( initialData, localCallback, externalCallback, modelAfter, modelAfterUndo ) {
			setModelData( model, initialData );

			model.change( localCallback );

			model.enqueueChange( 'transparent', externalCallback );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ), 'after operations' ).to.equal( modelAfter );

			editor.execute( 'undo' );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ), 'after undo' ).to.equal( modelAfterUndo );

			editor.execute( 'redo' );

			expect( formatTable( getModelData( model, { withoutSelection: true } ) ), 'after redo' ).to.equal( modelAfter );
		}

		function _removeColumn( writer, columnIndex, rows ) {
			const table = root.getChild( 0 );

			for ( const index of rows ) {
				const tableRow = table.getChild( index );
				const tableCell = tableRow.getChild( columnIndex );

				writer.remove( tableCell );
			}
		}

		function _removeRow( writer, rowIndex ) {
			const table = root.getChild( 0 );
			const tableRow = table.getChild( rowIndex );

			writer.remove( tableRow );
		}

		function _insertRow( writer, rowIndex, rowData ) {
			const table = root.getChild( 0 );

			const parsedTable = parse(
				modelTable( [ rowData ] ),
				model.schema
			);

			writer.insert( parsedTable.getChild( 0 ), table, rowIndex );
		}

		function _insertCell( writer, rowIndex, index ) {
			const table = root.getChild( 0 );
			const tableRow = table.getChild( rowIndex );

			writer.insertElement( 'tableCell', tableRow, index );
		}

		function _setAttribute( writer, attributeKey, attributeValue, path ) {
			const node = root.getNodeByPath( path );

			writer.setAttribute( attributeKey, attributeValue, node );
		}

		function _insertColumn( writer, columnIndex, rows ) {
			const table = root.getChild( 0 );

			for ( const index of rows ) {
				const tableRow = table.getChild( index );
				const tableCell = writer.createElement( 'tableCell' );

				writer.insert( tableCell, tableRow, columnIndex );
			}
		}
	} );
} );
