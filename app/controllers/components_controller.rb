class ComponentsController < ApplicationController
  allow_unauthenticated_access only: %i[ index show ]
  before_action :set_component, only: [:show, :edit, :update, :destroy]

  def index
    @components = if Current.user
      Current.user.components
    else
      Component.where(user_id: nil)
    end
  end

  def show
  end

  def new
    @component = Component.new
  end

  def create
    @component = Component.new(component_params)
    @component.user = Current.user if Current.user

    if @component.save
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
      @component = if Current.user
        Current.user.components.find_by(id: params[:id]) || Component.where(user_id: nil).find_by(id: params[:id])
      else
        Component.where(user_id: nil).find_by(id: params[:id])
      end
      
      # Handle case where component not found or doesn't belong to user
      redirect_to components_path, alert: "Component not found." and return unless @component
    end

    def component_params
      params.require(:component).permit(:name, :description, :height, :depth, :color)
    end
end
