import {reduce, sortBy, uniq} from 'lodash';
import moment from 'moment';
import {Log, RN, RN2} from 'utils';
import {ITheatre, IPerformance} from 'services/bot/types';

const mysql = require('serverless-mysql')({
  config: {
    host: "remotemysql.com",
    user: "7a9EKOagJL",
    password: "lIpVHtzmPM",
    port: 3306,
    database: "7a9EKOagJL"
  }
});
//import util from 'util';

const log = Log('theatres.theatres');

//const con = mysql.createConnection();

//const conn = util.promisify(con.connect).bind(con);
//const query = util.promisify(con.query).bind(con);

export const getTheatresData = async (theatreName: string): Promise<ITheatre[]> => {
  // try{
  //   await conn();
  // } catch(error){
  //   log.err(error);
  //   return null;
  // }
  log.debug('getting theatres data');
  let data = [];
  let temp, temp2;
  try {
    if(theatreName)
      temp = await mysql.query("SELECT * FROM Theatres WHERE `name`=\'"+theatreName+"\'");
    else{
      temp = await mysql.query("SELECT theatre_id, `name` FROM Theatres");
      temp2 = await mysql.query("SELECT n_theatre, COUNT(n_performance) FROM Performances GROUP BY n_theatre");
      log.debug("KEYS OF GROUP BY ELEMENT " + Object.keys(temp2[0]));
    }
  } catch (error) {
    log.err(error);
    return null;
  }
  for (const theatre of temp) {
    data.push(
      {
        name: theatre.name,
        n_perf: temp2.find((element) => element.n_theatre===theatre.theatre_id)["COUNT(n_performance)"]
      }
    );
  }
  log.debug('getting theatres data done');
  log.trace('length=', data.length, 'cinemas=', data);

  return data;
};

export const moviesListFromCinemasData = (cinemas: ITheatre[]): string[] => {
  const res: string[] = [];
  for (const cinema of cinemas) {
    for (const movie of cinema.performances) {
      res.push(movie.name);
    }
  }
  return uniq(res);
};

const moviePriorityFromCinemas = (title: string, cinemas: ITheatre[]): number => {
  let sessionsCount = 0;
  for (const cinema of cinemas) {
    const movie = cinema.performances.find((item) => item.name === title);
    if (movie) {
      sessionsCount += movie.dates.length;
    }
  }
  return sessionsCount;
};

// Text

interface IMoviesMsg {
  priority: number;
  msg: string;
}

export const cinemsDataToMsg = (cinemas: ITheatre[]): string => {
  const titles = moviesListFromCinemasData(cinemas);
  const moviesMsg: IMoviesMsg[] = [];
  for (const title of titles) {
    const msg = getMovieMsg(title, cinemas);
    if (msg) {
      const priority = moviePriorityFromCinemas(title, cinemas);
      moviesMsg.push({msg, priority});
    }
  }
  const sortMoviesMsg = sortBy(moviesMsg, ({priority}) => -priority);
  return reduce(sortMoviesMsg, (memo, {msg}) => (
    memo ? `${memo}${RN2}${msg}` : msg
  ), '');
};

export const theatresDataToListMsg = (theatres: ITheatre[]): string => {
  const theatresMsg: string[] = [];
  for (const theatre of theatres) {
    const msg = `Театр: ${theatre.name}${RN}\tК-ть вистав: ${theatre.n_perf}`;
    theatresMsg.push(msg);
  }
  return reduce(theatresMsg, (memo, msg) => (
    memo ? `${memo}${RN2}${msg}` : msg
  ), '');
};

const getMovieMsg = (title: string, cinemas: ITheatre[]): string | null => {
  if (!title) {
    return null;
  }
  let str = `🎭Вистава: *${title}*`;
  for (const cinema of cinemas) {
    const cStr = cinemaToMovieMsg(title, cinema);
    if (cStr) {
      str = `${str}${RN2}${cStr}`;
    }
  }
  return str;
};

const cinemaToMovieMsg = (title: string, cinema: ITheatre): string | null => {
  const {name: cTitle, performances: cMovies} = cinema;
  const movie = cMovies.find((item) => item.name === title);
  if (!movie) {
    return null;
  }
  const {dates} = movie;
  const str = sessionToStr(dates);
  if (!str) {
    return null;
  }
  const genre = `Жанр: ${movie.genre}`;
  const duration = `Тривалість: ${dateStrToTime(movie.duration)}`;
  return `Де: ${cTitle}${RN}${str}${RN}${genre}${RN}${duration}`;
};

const sessionToStr = (sessions: string[]): string => {
  let str: string = '';
  const sortItems = sortBy(sessions, (date) => new Date(date).getTime());
  const strItems = uniq(sortItems);
  for (const item of strItems) {
    str = str ? `${str}, \`${item}\`` : `\`${item}\``;
  }
  return `Коли: ${str}`;
};

const dateStrToTime = (val: string) => (
  moment(val).format('HH:mm')
);

// const getTitle = (title_id: number): string => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Titles.title_name FROM 7a9EKOagJL.Titles WHERE 7a9EKOagJL.Titles.title_id="+title_id+";", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

export const getPhotos = async (name: string): Promise<string[]> => {
  let perf = true;
  let source = await mysql.query("SELECT n_performance FROM Performances WHERE `name`='"+name+"'");
  if(source.length === 0){
    const temp = name.split(" ");
    source = await mysql.query("SELECT worker_code FROM Workers WHERE `name`='"+temp[1]+"' AND surname='"+temp[0]+"' AND is_author=0");
    perf = false;
  }
  const data = [];
  const qP = perf ? "n_performance="+source[0].n_performance : "n_photo IN (SELECT Photogallery.n_photo FROM Photogallery_Actors WHERE n_actor="+source[0].worker_code+")";
  const res = await mysql.query("SELECT photo FROM Photogallery WHERE " + qP);
  for(const photo of res){
    data.push(photo.photo);
  }
  return data;
 }

 export const getInfo = async (name: string): Promise<string> => {
   let data;
   let type = 1;
   let source = await mysql.query("SELECT * FROM Performances WHERE `name`='"+name+"'");
   if(source.length===0){
     type=0;
     source = await mysql.query("SELECT * FROM Theatres WHERE `name`='"+name+"'");
     if(source.length===0){
       type=2;
       const temp = name.split(" ");
       source = await mysql.query("SELECT * FROM Workers WHERE `name`='"+temp[1]+"' AND surname='"+temp[0]+"'");
     }
   }
   const item = source[0];
   switch(type){
     //Theatre
     case 0:
       data=
        `Назва: ${item.name}${RN}`+
        `Адреса: ${item.street}, ${item.building}, ${item.district}, ${item.postal_code}${RN}`+
        `Телефон: ${item.phone}${RN}`+
        `Графік: ${dateStrToTime(item.opening)} - ${dateStrToTime(item.closing)}${RN}`;
       break;
     //Performance
     case 1:
       data=
        `Назва: ${item.name}${RN}`+
        `К-ть дій: ${item.actions}${RN}`+
        `Вікове обмеження: ${item.max_age}+${RN}`+
        `Мова: ${item.language}${RN}`+
        `Максимальна вартість квитка: ${item.max_price}${RN}`+
        `Мінімальна вартість квитка: ${item.min_price}${RN}`+
        `Тривалість: ${dateStrToTime(item.duration)}${RN}`+
        `Автори: ${(await getAuthors(item.n_performance)).join("; ")}${RN}`+
        `Жанр: ${await getGenre(item.n_genre)}${RN}`+
        `Дати проведення: ${(await getDates(item.n_performance)).join("; ")}${RN}`+
        `Театр: ${await getTheatre(item.n_theatre)}${RN}`+
        `Ролі: ${(await getRolesP(item.n_performance)).join("; ")}`;
        break;
      //Artist
      case 2:
        data=
        `Ім'я: ${item.name}${RN}`+
        `Прізвище: ${item.surname}${RN}`+
        `Посада : ${(await mysql.query("SELECT title_name FROM Titles WHERE title_id IN (SELECT Workers.title_id FROM Workers WHERE worker_code="+item.worker_code+")"))[0].title_name}${RN}`;
        break;
    }
    return data;
 }

export const getAllPerformances = async (): Promise<IPerformance[]> => {
  const temp2 = await mysql.query("SELECT name, AVG(max_price), AVG(min_price),  FROM Performances GROUP BY name");
  log.debug(Object.keys(temp2[0]));
  const temp = await mysql.query("SELECT * FROM Performances");
  const data = [];
  for(const performance of temp){
    data.push({
      genre: await getGenre(performance.n_genre),
      name: performance.name,
      actions: performance.actions,
      max_price: temp2.find((element) => element.name === performance.name).max_price,
      min_price: temp2.find((element) => element.name === performance.name).min_price,
      dates: await getDates(performance.n_performance),
      roles: await getRolesP(performance.n_performance),
      theatre: await getTheatre(performance.n_theatre)
    });
  }
  return data;
}

const getTheatre = async (n_theatre: number): Promise<string> => {
  const temp = await mysql.query("SELECT name FROM Theatres WHERE theatre_id="+n_theatre);
  return temp[0].name;
}

// const getPerformances = async (theatre_id: number): Promise<IPerformance[]> => {
//   let data = [];
//   const temp = await mysql.query("SELECT * FROM Performances WHERE n_theatre=" + theatre_id);
//   for (const performance of temp) {
//     data.push({
//       n_performance: performance.n_performance,
//       genre: await getGenre(performance.n_genre),
//       name: performance.name,
//       actions: performance.actions,
//       max_age: performance.max_age,
//       language: performance.language,
//       max_price: performance.max_price,
//       min_price: performance.min_price,
//       duration: performance.duration,
//       based_on: performance.based_on,
//       dates: await getDates(performance.n_performance),
//       authors: await getAuthors(performance.n_performance),
//       roles: await getRolesP(performance.n_performance),
//       photos: await getPhotos(performance.n_performance)
//     });
//   }
//   return data;
// }

const getGenre = async (n_genre: number): Promise<string> => {
  const genre = await mysql.query("SELECT name FROM Genres WHERE Genres.n_genre="+n_genre);
  log.debug("Got genre: "+genre[0].name);
  return genre[0].name;
}

const getAuthors = async (n_performance: number): Promise<string[]> => {
  let data = [];
  const temp = await mysql.query("SELECT name, surname, patronymic FROM Workers WHERE worker_code IN (SELECT n_author FROM Authors_Performance WHERE n_performance=" + n_performance + ")");
  for (const author of temp)
    data.push(author.surname + " " + author.name + " " + author.patronymic);
  return data;
}

const getDates = async (n_performance: number): Promise<string[]> => {
  const temp = await mysql.query("SELECT performance_start FROM Date_Time_Performance WHERE n_performance=" + n_performance);
  const data = [];
  for(const date of temp){
    data.push(date.performance_start);
  }
  return data;
}

// const getAwards = (worker_code: number): string[] => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Awards.name FROM 7a9EKOagJL.Awards WHERE 7a9EKOagJL.Awards.worker_n="+worker_code+";", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

const getRolesP = async (n_performance: number): Promise<string[]> => {
  const temp = await mysql.query("SELECT name FROM Roles WHERE n_performance=" + n_performance);
  const data = [];
  for(const role of temp) {
    data.push(role.name);
  }
  return data;
}

// const getCreations = (worker_code: number): string[] => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Performances.name FROM 7a9EKOagJL.Performances WHERE 7a9EKOagJL.Performances.n_performance IN (SELECT 7a9EKOagJL.Authors_Performance.n_performance FROM 7a9EKOagJL.Authors_Performance WHERE 7a9EKOagJL.Authors_Performance.n_author="+worker_code+");", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

// const getWorkers = async (theatre_id: number): Promise<string[]> => {
//   let data = [];
//   const res = await mysql.query("SELECT name, surname, patronymic FROM Workers WHERE theatre_id=" + theatre_id);
//   for (const worker of res)
//     data.push(worker.name + " " + worker.surname + " " + worker.patronymic);
//   return data;
// }

// const getActors = async (theatre_id: number): Promise<string[]> => {
//     let data = [];
//     const res = await mysql.query("SELECT name, surname, patronymic FROM Workers WHERE title_id IN " +
//       "(SELECT title_id FROM Titles WHERE title_name='Актор') AND theatre_id=" + theatre_id);
//     for (const worker of res)
//       data.push(worker.name + " " + worker.surname + " " + worker.patronymic);
//     return data;
// }

export const findActors = async (name: string): Promise<string[]> => {
  let data = [];
  let theatre = true;
  let source = await mysql.query("SELECT theatre_id FROM Theatres WHERE `name`='"+name+"'");
  if(source.length === 0){
    source = await mysql.query("SELECT n_performance FROM Performances WHERE `name`='"+name+"'");
    theatre = false;
  }
  const qP = theatre ? "theatre_id="+source[0].theatre_id : "worker_code IN (SELECT n_actor FROM Roles_Actors WHERE n_role IN (SELECT Roles.n_role FROM Roles WHERE n_performance="+source[0].n_performance+"))";
  const res = await mysql.query("SELECT `name`, surname FROM Workers WHERE " + qP + " AND is_author=0");
  for(const actor of res){
    data.push(actor.surname+" "+actor.name);
  }
  return data;
}
