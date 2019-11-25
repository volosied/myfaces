import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.ConverterException;
import javax.faces.validator.FacesValidator;

import javax.faces.application.FacesMessage;

import javax.faces.validator.ValidatorException;

import javax.faces.validator.Validator;

import sample.UserBean;

@FacesValidator(value = "testValidator", managed = true)
public class CustomValidator implements Validator<Integer> {

   @Override
   public void validate(FacesContext facesContext, UIComponent component, Integer number) throws ValidatorException {
      FacesMessage msg = new FacesMessage("Validation Message!");
      msg.setSeverity(FacesMessage.SEVERITY_ERROR);
      throw new ValidatorException(msg);
   }
}