

let Gridify = function(options = {}) { 
    let grid = this;
    grid.container = options.container;
    if(typeof(grid.container) === 'string') {
        grid.container = document.getElementById(grid.container);
    }

    grid.create = function(options) {
        if(grid.container) { _clear(grid.container); }

        grid.table.create(options);
        grid.caption.create(options.caption);
        grid.header.create(options.headers);
        grid.body.create(options.data, options.columns);
        grid.footer.create(options.footers);


        if(grid.container) {
            grid.container.appendChild(_table); 
        }
    }

    grid.onTableCreated = function(table, options) { if(options.onTableCreated) { options.onTableCreated(table, options); } }
    grid.onCaptionCreated = function(caption, captionDefinition) { if(options.onCaptionCreated) { options.onCaptionCreated(caption, captionDefinition); } }
    grid.onHeaderCreated = function(tHead, headers) { if(options.onHeaderCreated) { options.onHeaderCreated(tHead, headers); } }
    grid.onHeaderCellCreated = function(th, headerDefinition) { if(options.onHeaderCellCreated) { options.onHeaderCellCreated(th, headerDefinition); } }
    grid.onTableBodyCreated = function(tBody, columns) { if(options.onTableBodyCreated) { options.onTableBodyCreated(tBody, columns); } }
    grid.onTableRowCreated = function(tr, columns) { if(options.onTableRowCreated) { options.onTableRowCreated(tr, columns); } }
    grid.onTableCellCreated = function(td, columnDefinition) { if(options.onTableCellCreated) { options.onTableCellCreated(td, columnDefinition); } }
    grid.onFooterCreated = function(tFoot, footers) { if(options.onFooterCreated) { options.onFooterCreated(tFoot, footers); } }
    grid.onFooterCellCreated = function(td, footerDefinition) { if(options.onFooterCellCreated) { options.onFooterCellCreated(td, footerDefinition); } }

    let _clear = function(container) {
        while(container && container.firstChild) { 
            container.removeChild(container.firstChild); 
        }
    }

    let _setAttributes = function(el, attributes) {
        for(let k in attributes) {
            el.setAttribute(k, attributes[k]);
        }
    }

    let _table;
    grid.table = { 
        create : function(options) {
            _table = grid.table.initialize(options);
            _setAttributes(_table, options.attributes);
            grid.onTableCreated(_table, _table.options);
        }
        , initialize : function(options) {
            _table = document.createElement('table');
            _table.id = grid.table._getTableId(options);
            _table.options = options;
            return _table;
        }
        , _getTableId : function(options) {
            if(_table.id) { return _table.id; }
            if(options.id) { return options.id; }
            if(grid.container) { return grid.container.id + '-grid'; }
            return 'new-grid';
        }
    }
    Object.defineProperty(grid, 'html', { get : () => _table });

    grid.caption = {
        create : function(captionOptions) {
            if(!captionOptions) { return; }
            let caption = grid.caption.initialize(captionOptions);

            _setAttributes(caption, caption.options.attributes);
            caption.innerText = caption.options.text;

            grid.onCaptionCreated(caption, caption.options);
        }
        , initialize : function(captionOptions) {
            let caption = _table.createCaption();

            caption.id = _table.id + '-caption';
            caption.options = typeof(captionOptions) === 'string' 
                ? { text : captionOptions } 
                : captionOptions;

            return caption;
        }
    }

    grid.header = {
        create : function(headers) {
            if(!headers) { return; }
            let tHead = grid.header.initialize(headers);

            grid.header.addHeaderCells();

            grid.onHeaderCreated(tHead, tHead.options);
        }
        , initialize : function(headers) {
            if(_table.tHead) { _table.removeChild(_table.tHead); }
            let tHead = _table.createTHead();

            tHead.id = _table.id + '-thead';
            tHead.options = grid.header._parseHeaders(headers);
            
            return tHead;
        }
        , _parseHeaders : function(headers) {
            return headers.map(opt => {
                if(typeof(opt) === 'string') { opt = { text : opt } }
                return opt;
            })
        }
        , addHeaderCells : function() {
            let hr = _table.tHead.insertRow();
            let options = _table.tHead.options;
            options.forEach(o => { grid.header.addHeaderCell(hr, o); });
        }
        , addHeaderCell : function(headerRow, headerDefinition) {
            let th = headerRow.insertCell();
            th.id = _table.tHead.id + '-' + headerDefinition.text || headerRow.cells.length;

            th.innerText = headerDefinition.text;
            _setAttributes(th, headerDefinition.attributes);

            grid.onHeaderCellCreated(th, headerDefinition); 
        }
    }

    grid.body = {
        create : function(data, columns = options.columns) {
            let tBody = grid.body.initialize(columns);

            for(let idx in data) {
                grid.body.addTableRow(tBody, idx, data[idx])
            }

            grid.onTableBodyCreated(tBody, tBody.options);
        }
        , initialize : function(columns) {  
            while(_table.tBodies.length) { _table.removeChild(_table.tBodies[0]); }
            let tBody = _table.createTBody();
            tBody.id = _table.id + '-tbody';
            tBody.options = columns;
            return tBody;
        }
        , _parseColumns : function(columns) {
            return columns.map(col => {
                if(typeof(col) === 'string') { col = { text : col }}
            })
        }
        , clear : function() { _clear(_table.tBodies[0]); }
        , getColumnDefinition : function(field) {
            let colDefs = _table.tBodies[0].options;
            if(!colDefs) { return; }
            return colDefs.find(d => d.field == field);
        }
        , addTableRow : function(tBody, ridx, rowData) {
            let tr = tBody.insertRow();
            tr.id = tBody.id + '-' + ridx;

            let colDefs = tBody.options;
            if(colDefs){
                for(let d in colDefs) {
                    let field = colDefs[d].field;
                    grid.body.addTableCell(tr, field, rowData[field])
                }
            }
            else { 
                for(let field in rowData) {
                    grid.body.addTableCell(tr, field, rowData[field]);
                }
            }

            grid.onTableRowCreated(tr);
        }
        , addTableCell : function(tr, field, value) {
            let td = tr.insertCell();
            td.id = tr.id + '-' + field;

            td.field = field;
            td.innerText = value;

            let colDef = grid.body.getColumnDefinition(field);
            if(colDef && colDef.attributes) { _setAttributes(td, colDef.attributes); }
            
            grid.onTableCellCreated(td, colDef);
        }
    }

    grid.data = { 
        get : function() {
            return Array.from(_table.tBodies[0].rows)
                .map(r => grid.data.getRowData(r));
        }
        , set : function(data) {
            grid.body.create(data);
        }
        , getRowData : function(tr) {
            let rowData = {};
            Array.from(tr.cells).forEach(td => {
                rowData[td.field] = td.innerText;
            });
            return rowData;
        }
    }

    grid.footer = { 
        create : function(footers = []) {
 //           if(!footers) { return; }
            let tFoot = grid.footer.initialize(footers);

            grid.footer.addFooterCells();

            grid.onFooterCreated(tFoot, tFoot.options);
        }
        , initialize : function(footers) {
            if(_table.tFoot) { _table.removeChild(_table.tFoot); }
            let tFoot = _table.createTFoot();
            
            tFoot.id = _table.id + '-tfoot';
            tFoot.options = grid.footer._parseFooters(footers);;
            
            return tFoot;
        }
        , _parseFooters : function(footers) {
            return footers.map(opt => { 
                if(typeof(opt) === 'string') { opt = { text : opt } }
                return opt;
            });
        }
        , addFooterCells : function() {
            let fr = _table.tFoot.insertRow();
            let options = _table.tFoot.options;
            options.forEach(o => { grid.footer.addFooterCell(fr, o)});
        }
        , addFooterCell : function(footerRow, footerDefinition) {
            let td = footerRow.insertCell();
            td.id = _table.tFoot.id + '-' + footerDefinition.text;

            td.innerText = footerDefinition.text;
            _setAttributes(td, footerDefinition.attributes);

            grid.onFooterCellCreated(td, footerDefinition);
        }
    }

    for(var k in grid.extensions) {
        grid.extensions[k].apply(grid, arguments);
    }

    grid.create(options);

    return grid;
}
Gridify.prototype.extensions = {};