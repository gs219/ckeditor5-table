/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module table/commands/inserttablecommand
 */

import Command from '@ckeditor/ckeditor5-core/src/command';
import Position from '@ckeditor/ckeditor5-engine/src/model/position';
import TableUtils from '../tableutils';

/**
 * The insert table command.
 *
 * @extends module:core/command~Command
 */
export default class InsertTableCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const schema = model.schema;

		const validParent = getInsertTableParent( selection.getFirstPosition() );

		this.isEnabled = schema.checkChild( validParent, 'table' );
	}

	/**
	 * Executes the command.
	 *
	 * Inserts table of given rows and columns into the editor.
	 *
	 * @param {Object} options
	 * @param {Number} [options.rows=2] Number of rows to create in inserted table.
	 * @param {Number} [options.columns=2] Number of columns to create in inserted table.
	 * @fires execute
	 */
	execute( options = {} ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const tableUtils = this.editor.plugins.get( TableUtils );

		const rows = parseInt( options.rows ) || 2;
		const columns = parseInt( options.columns ) || 2;

		const firstPosition = selection.getFirstPosition();

		const isRoot = firstPosition.parent === firstPosition.root;
		const insertPosition = isRoot ? Position.createAt( firstPosition ) : Position.createAfter( firstPosition.parent );

		model.change( writer => {
			const table = tableUtils.createTable( insertPosition, rows, columns );

			writer.setSelection( Position.createAt( table.getChild( 0 ).getChild( 0 ) ) );
		} );
	}
}

// Returns valid parent to insert table
//
// @param {module:engine/model/position} position
function getInsertTableParent( position ) {
	const parent = position.parent;

	return parent === parent.root ? parent : parent.parent;
}
