import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.ConverterException;
import javax.faces.convert.FacesConverter;

import sample.MyEntity;

@FacesConverter(value = "customConverter", managed = true)
public class CustomConverter implements Converter<TestBean> {
   
   //Not used in the app since there is no form submission in the app. Only a GET request. 
   @Override
   public TestBean getAsObject(FacesContext facesContext, UIComponent component, String value) {
      return new TestBean();
   }

   @Override
   public String getAsString(FacesContext facesContext, UIComponent component, TestBean value) {
      System.out.println(value);
      return "The number is " + value.toString();
   }
}