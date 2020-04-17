export interface IPerformance {
  n_performance: number;
  genre: string;
  name: string;
  actions: number;
  max_age: number;
  language: string;
  max_price: number;
  min_price: number;
  duration: string;
  based_on?: string;
  dates: string[];
  authors: string[];
  roles: string[];
  theatre: string;
  photos?: string[];
  theatres: string[];
}

export interface IWorker {
  worker_code: number;
  surname: string;
  name: string;
  patronymic: string;
  birth_date: string;
  title: string;
  age: number;
  adult: boolean;
  photo?: string;
  photos?: string[];
  biography?: string;
  is_author: boolean;
  awards?: string[];
  roles?: string[];
  creations?: string[];
}

export interface IRole {
  n_role: number;
  name: string;
  actors: string[];
}

export interface ITheatre {
  theatre_id: number;
  name: string;
  street: string;
  building: string;
  district: string;
  postal_code: string;
  phone: string;
  opening: string;
  closing: string;
  doc_link?: string;
  performances: IPerformance[];
  workers: string[];
  n_perf: number;
}
