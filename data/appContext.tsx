import React, { useState, useEffect } from 'react';
import { doc, initializeFirestore, onSnapshot, Firestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useContext } from 'react';
import { AuthContext } from './firebase/authContext';
import { getDatabase, Database, ref, get, child, goOnline } from 'firebase/database';

import parseTraps from './domain/traps';
import parseStamps from './domain/stamps';
import parsePlayer from './domain/player';
import parseAlchemy from './domain/alchemy';

class IdleonData {
  private data: Map<string, any>
  private lastUpdated: string

  constructor(data: Map<string, any>, lastUpdated: string) {
    this.data = data;
    this.lastUpdated = lastUpdated;
  }

  public getData = () => {
    return this.data;
  }

  public getLastUpdated = () => {
    return this.lastUpdated;
  }
}

export const AppContext = React.createContext<IdleonData>(new IdleonData(new Map(), ""));

/* 
Known paths:
1. _uid/${user.uid} = character names
*/

export const AppProvider: React.FC<{}> = (props) => {
  const [state, setState] = useState(new IdleonData(new Map(), ""));
  const user = useContext(AuthContext);
  const [db, setDB] = useState<Firestore | undefined>(undefined)
  const [realDB, setRealDB] = useState<Database | undefined>(undefined)
  const [charNames, setCharNames] = useState<Array<string>>([]);
  const getAccountData = async () => {
    if (db?.type == "firestore" && user) {
      if (charNames.length == 0 && realDB) {
        goOnline(realDB);
        const dbRef = ref(realDB);
        get(child(dbRef, `_uid/${user.uid}`)).then((snapshot) => {
          if (snapshot.exists()) {
            setCharNames(snapshot.val());
          } else {
            console.log("No data available");
          }
        }).catch((error) => {
          console.error(error);
        });
      }

      const unsub = onSnapshot(doc(db, "_data", user.uid),
        { includeMetadataChanges: true }, (doc) => {
          let accountData = new Map();
          //console.log(doc.data());
          accountData.set("stamps", parseStamps(doc.get("StampLv")));
          const parsedTraps = parseTraps([...Array(9)].map((_, i) => {
            return doc.get(`PldTraps_${i}`)
          }));
          accountData.set("traps", parsedTraps);
          accountData.set("players", parsePlayer([...Array(9)].map((_, i) => {
            return {
              equipment: doc.get(`EquipOrder_${i}`),
              equipmentStoneData: JSON.parse(doc.get(`EMm0_${i}`)),
              toolsStoneData: JSON.parse(doc.get(`EMm1_${i}`)),
              stats: doc.get(`PVStatList_${i}`),
              classNumber: doc.get(`CharacterClass_${i}`),
              afkTarget: doc.get(`AFKtarget_${i}`),
              currentMap: doc.get(`CurrentMap_${i}`),
              starSigns: doc.get(`PVtStarSign_${i}`).split(','),
              money: doc.get(`Money_${i}`)
            }
          }), charNames))
          accountData.set("playerNames", charNames);
          accountData.set("alchemy", parseAlchemy(doc.get("CauldronInfo")))
          const currentDate = new Date().toISOString().split('T')[0];
          const currentTime = new Date().toISOString().split('T')[1].split('.')[0];
          const newData = new IdleonData(accountData, `${currentDate} ${currentTime}`);
          setState(newData);
        });
    }
  }

  useEffect(() => {
    const app = getApp();
    if (!db) {
      setDB(initializeFirestore(app, {}));
    }
    if (!realDB) {
      setRealDB(getDatabase(app));
    }
    if (user) {
      getAccountData();
    }
  }, [user, db, charNames]);

  return (
    <AppContext.Provider value={state}>
      {props.children}
    </AppContext.Provider>
  );
};