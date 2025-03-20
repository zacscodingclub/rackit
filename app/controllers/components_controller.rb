class ComponentsController < ApplicationController
  before_action :set_component, only: [:show, :edit, :update, :destroy]

  def index
    @components = Component.all
  end

  def show
  end

  def new
    @component = Component.new
  end

  def create
    @component = Component.new(component_params)

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
      @component = Component.find(params[:id])
    end

    def component_params
      params.require(:component).permit(:name, :description, :height, :depth, :color)
    end
end
