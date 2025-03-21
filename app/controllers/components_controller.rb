class ComponentsController < ApplicationController
  allow_unauthenticated_access only: %i[ index show ]
  before_action :set_current_user  # Try to set Current.user for all actions
  before_action :set_component, only: [:show, :edit, :update, :destroy] # Not applied to new or create

  def index
    # Show all components as they should be reusable by all users
    components_base = Component.all
    
    # Handle sorting
    @sort_column = sort_column
    @sort_direction = sort_direction
    @components = components_base.order(@sort_column => @sort_direction)
  end

  def show
  end

  def new
    @component = Component.new
  end

  def create
    @component = Component.new(component_params)
    
    # Debug log to check Current.user
    Rails.logger.debug "DEBUG: Current.user: #{Current.user.inspect}"
    Rails.logger.debug "DEBUG: Current.session: #{Current.session.inspect}"
    
    @component.user = Current.user if Current.user
    # Debug log to check association
    Rails.logger.debug "DEBUG: Component user_id after assignment: #{@component.user_id}"

    if @component.save
      # Debug log after save
      Rails.logger.debug "DEBUG: Component saved with id: #{@component.id}, user_id: #{@component.user_id}"
      redirect_to @component, notice: 'Component was successfully created.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @component.update(component_params)
      redirect_to @component, notice: 'Component was successfully updated.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @component.destroy
    redirect_to components_url, notice: 'Component was successfully destroyed.'
  end

  private
    def set_component
      # Allow viewing any component (all components are public and reusable)
      @component = Component.find_by(id: params[:id])
      
      # Handle case where component not found
      redirect_to components_path, alert: "Component not found." and return unless @component
      
      # For actions that modify the component (edit, update, destroy), check ownership
      if ['edit', 'update', 'destroy'].include?(action_name) && Current.user
        # Only allow if the component belongs to the current user
        unless @component.user_id == Current.user.id
          redirect_to component_path(@component), alert: "You don't have permission to modify this component." and return
        end
      end
    end

    def component_params
      params.require(:component).permit(:name, :description, :brand, :height, :depth, :color)
    end
    
    def sort_column
      %w[name brand height depth created_at updated_at].include?(params[:sort]) ? params[:sort] : "name"
    end
    
    def sort_direction
      %w[asc desc].include?(params[:direction]) ? params[:direction] : "asc"
    end
    
    def set_current_user
      # Use the existing session resumption mechanism to try to set Current.user
      # This is called even for actions that skip require_authentication
      Current.session ||= find_session_by_cookie
    end
end
