const CAPACITY = {
  B1:120, B2:100, B3:60,  B4:120, B5:120, B6:150, B7:50,  B8:80,  B9:200,
  B10:40, B11:80, B12:60, B13:40, B14:80, B15:100, B16:60, B17:90, B18:120,
  B19:70, B20:90, B21:120, B22:70, B23:90, B24:150, B25:60, B26:120, B27:160,
  B28:100, B29:100, B30:100, B31:80, B32:60, B33:120, B34:120
};

const NAMES = {
  B1:"Engineering Carpentry Shop",
  B2:"Engineering Workshop",
  B3:"",
  B4:"Generator Room",
  B5:"",
  B6:"Structure Lab",
  B7:"Administrative Building",
  B8:"Canteen",
  B9:"Lecture Room 10/11",
  B10:"Engineering Library",
  B11:"Department of Chemical and process Engineering",
  B12:"Security Unit",
  B13:"Drawing Office 2",
  B14:"Faculty Canteen",
  B15:"Department of Manufacturing and Industrial Engineering",
  B16:"Professor E.O.E. Perera Theater",
  B17:"Electronic Lab",
  B18:"Washrooms",
  B19:"Electrical and Electronic Workshop",
  B20:"Department of Computer Engineering",
  B21:"",
  B22:"Environmental Lab",
  B23:"Applied Mechanics Lab",
  B24:"New Mechanics Lab",
  B25:"",
  B26:"",
  B27:"",
  B28:"Materials Lab",
  B29:"Thermodynamics Lab",
  B30:"Fluids Lab",
  B31:"Surveying and Soil Lab",
  B32:"Department of Engineering Mathematics",
  B33:"Drawing Office 1",
  B34:"Department of Electrical and Electronic Engineering ",
};

const ALL = Object.keys(CAPACITY).map(id => ({
  building_id: id,
  building_name: NAMES[id] || id,
  capacity: CAPACITY[id]
}));

function getAll() { return ALL; }
function getById(id) { return ALL.find(b => b.building_id === id); }

module.exports = { getAll, getById };
