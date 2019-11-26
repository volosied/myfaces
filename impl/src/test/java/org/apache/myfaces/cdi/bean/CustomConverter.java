package org.apache.myfaces.cdi.bean;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.FacesConverter;

@FacesConverter(value="customConverter", managed = true)
public class CustomConverter implements Converter<EntityBean> {
   
   //Not used in the app since there is no form submission in the app. Only a GET request. 
   @Override
   public EntityBean getAsObject(FacesContext facesContext, UIComponent component, String value) {
      return new EntityBean();
   }

   @Override
   public String getAsString(FacesContext facesContext, UIComponent component, EntityBean value) {
      return "Success!";
   }
}