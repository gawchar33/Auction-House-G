import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
    private productApi = 'http://127.0.0.1:8000/product/';

    constructor(private http: HttpClient){}

    getProducts(): Observable<any>{
        return this.http.get(this.productApi);
    }

}
