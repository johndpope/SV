import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, Setting,SettingApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent extends ListMasterBaseComponent {
  public titleTrue:string=`Settings`;
  public navigator:string="/setting";
  listCategorie:Array<any>;
  dataList:any;
  categorieAccess:any;
  indexAccess:number=0;
  detailData:any;
  isEdit:boolean=false;
  constructor(public api: SettingApi,public route:ActivatedRoute, public router:Router)
  {
    super();
  }
  ngOnInit(){
  	$('.navbar-brand').html(this.titleTrue);
  	// this.loadListCategorie();
  	this.sub=this.api.getCategories().subscribe(res=>{
  		this.listCategorie=res['data'];
  		
  		var index = this.listCategorie.indexOf('Default');    // <-- Not supported in <IE9
		if (index !== -1) {
		    this.listCategorie.splice(index, 1);
		}
		this.listCategorie.unshift('Default');
		this.categorieAccess=this.listCategorie[0];
  		this.loadDataList();
  	});
  }
  loadDataList()
  {
  	this.api.find({where:{category:this.categorieAccess}}).subscribe(res=>{
  		this.dataList=res;
  	})
  }
  loadListCategorie()
  {
  	this.api.getCategories().subscribe(res=>{
  		this.listCategorie=res['data'];

  		this.categorieAccess=this.listCategorie[0];
  	});
  }
  changeCategorie(index,categorie)
  {
  	this.indexAccess=index;
  	this.categorieAccess=categorie;
  	this.loadDataList();
  }
  popUpDetail(idSetting)
  {
  	this.api.find({where:{id:idSetting}}).subscribe((res:any)=>{
	  	this.detailData=res[0];
	  	$('#myModal').modal('show');
  	});
  }
  beginEdit(idSetting)
  {
  	this.api.find({where:{id:idSetting}}).subscribe((res:any)=>{
	  	this.detailData=res[0];
	  	$('#modelEdit').modal('show');
  	});
  	
  }
  saveDetail()
  {
  	if(this.detailData.configValue)
  	{
  		this.api.updateAttributes(this.detailData.id,this.detailData).subscribe(res=>{
  			if (!res['data']) {
              swal({
                title: "Not found",
                text: "This Booster does not exist",
                type: "error"
              },
              function(){
              });
              return;
            }
            swal("Success","Updated successfully!","success");
            this.loadDataList();
            $('#modelEdit').modal('hide');
  		});
  	}
  	else
  	{
  		swal("Warning","Value is empty!","warning");
  	}
  }
}
