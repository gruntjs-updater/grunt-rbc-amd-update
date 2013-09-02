/**
 * There is also "rbc amd update" task
 * which is a bit different, because it also updates Jam packages
 */
module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('rbc-amd-update', 'updates "pages" and "widgets".', function() {

    var path = require( 'path' ),

        //The second part here is for backward compatibility only
        //Remove it later!
        scriptsDirName = grunt.config.get( 'paths' ).scripts.src,
        
        widgetsDir = path.resolve( scriptsDirName + '/widgets' );

    updatePages( scriptsDirName );
    updateWidgets( scriptsDirName );

  });

  // ==========================================================================
  // UPDATE FUNCTIONS
  // ==========================================================================

  function updatePages( scriptsDirName ) {
    var fs = require( 'fs' ),
        path = require( 'path' ),

        pages = getDirs( scriptsDirName + '/pages' );

    if ( pages.length === 0 ) {
        return;
    }

    var mainjs = [
          'define([\n',
            '    ',
            getDeps({
              items: pages,
              separator: ',\n    '
            }),
          '\n',
          '], function(\n',
          '    ',
            getDepsJS({
              items: pages,
              separator: ',\n    '
            }),
          '\n',
          ') {\n\n',
          '    return {\n',
               '        ',
                 getPagesDeps({
                   items: pages,
                   separator: ',\n        '
                 }),
               '\n',
          '    };\n\n',
          '});'
        ].join( '' );
    
    fs.writeFileSync( path.normalize(scriptsDirName+'/pages/__main.js'), mainjs );
  };

  function updateWidgets( scriptsDirName ) {
    var fs = require( 'fs' ),
        path = require( 'path' ),

        widgets = getDirs( scriptsDirName + '/widgets' );

    if ( widgets.length === 0 ) {
        return;
    }

    var mainjs = [
          'define([\n',
            '    ',
            getDeps({
              items: widgets,
              separator: ',\n    '
            }),
          '\n',
          '], function(\n',
          '    ',
            getDepsJS({
              items: widgets,
              separator: ',\n    '
            }),
          '\n',
          ') {\n',
          '    function init() {\n',
                 getWidgetsInitialization( widgets ),
          '    }\n\n\n',
          '    return {\n',
               '        init: init\n',
          '    };\n',
          '});'
        ].join( '' );

    fs.writeFileSync( path.normalize(scriptsDirName+'/widgets/__main.js'), mainjs );
  };

  // ==========================================================================
  // PAGES
  // ==========================================================================

  function getPagesDeps( params ) {
    var deps = [],
        items = params.items;

    items.map(function( item ) {
      deps.push( getJSname(item) + ': ' + getJSname(item) );
    });

    return deps.join( params.separator );
  };

  // ==========================================================================
  // WIDGETS
  // ==========================================================================

  function getWidgetsInitialization( widgets ) {
    var inits = [];

    widgets.map(function( widget ) {
        var template = [
            '        if ( ' + getJSname(widget) + '.shouldRun() === true ) {\n',
            '            ' + getJSname(widget) + '.init();\n',
            '        }\n'
        ].join( '' );

        inits.push( template );
    });

    return inits.join( '\n' );
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  function getDirs( dir ) {
    var fs = require( 'fs' ),
        path = require( 'path' ),

        dir = path.normalize( dir ),

        dirs = [];

    try {
        var items = fs.readdirSync( dir ),
            itemsLng = items.length;
    } catch( err ) {
        return [];
    }

    items.map(function( item ) {
      var itemPath = path.normalize( dir + '/' + item );

      // should be a directory and not UNIX hidden directory
      if ( fs.lstatSync( itemPath ).isDirectory() && item.charAt(0) !== '.' ) {
        dirs.push( item );
      };
    });

    dirs.sort();

    return dirs;
  };

  function capitaliseFirstLetter( string ) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  function getJSname( name ) {
    name = name.split( '-' );

    var first = name.shift(),
        parts = [];

    name.map(function( part ) {
      parts.push( capitaliseFirstLetter( part ) );
    });

    return ( first + parts.join( '' ) );
  };

  function getDeps( params ) {
    var deps = [],
        items = params.items;

    items.map(function( item ) {
      deps.push( '\'./' + item + '/main\'' );
    });

    return deps.join( params.separator );
  };

  function getDepsJS( params ) {
    var deps = [],
        items = params.items;

    items.map(function( item ) {
      deps.push( getJSname(item) );
    });

    return deps.join( params.separator );
  };

};
