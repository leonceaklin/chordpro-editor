
import ChordSheetJS from 'chordsheetjs';
import ejs from 'ejs';


const parser = new ChordSheetJS.ChordProParser();
const divFormatter = new ChordSheetJS.HtmlDivFormatter();

export function parseSourceCode(content) {

    try{
      var songObject = parser.parse(content);
    }catch(e){}

    if(songObject !== undefined){

      var songMeta = {};

      var metaTypes = ["title","subtitle","artist","composer","lyricist","copyright","album","year","key","time","tempo","duration","capo","meta"]
      var metaData = songObject.rawMetaData;


      for (var i = 0; i < metaTypes.length; i++) {
        var metaTypeName = metaTypes[i];
        var meta = metaData[metaTypeName];

        if(meta !== undefined){
          songMeta[metaTypeName] = meta.values().next().value;
        }
      }

      songObject.rawMetaData = {};

      var songBody = divFormatter.format(songObject);
      return {songMeta: songMeta, songBody: songBody};
    }
    else{
      return false;
    }
}
